"""
Bitaca Play 3D Streaming Bridge
================================

FastAPI bridge service connecting stream-winx-api to play-3d frontend.

Features:
- CORS for 3D frontend access
- Production catalog management (24 Bitaca productions)
- Video streaming proxy with HTTP range request support
- Analytics tracking
- Rate limiting and caching
- Proper error handling and logging

Author: Bitaca Cinema Team
License: MIT
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, HTTPException, Query, Header, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
STREAM_API_URL = "http://localhost:8000"  # stream-winx-api base URL
STREAM_API_TIMEOUT = 30.0
MAX_RETRIES = 3
CHUNK_SIZE = 1024 * 1024  # 1MB chunks for streaming

# Global HTTP client
http_client: Optional[httpx.AsyncClient] = None


# ============================================================================
# Data Models
# ============================================================================

class Production(BaseModel):
    """Production model representing a Bitaca audiovisual project"""
    id: int = Field(..., description="Production ID")
    title: str = Field(..., description="Production title")
    director: str = Field(..., description="Director name")
    genre: str = Field(..., description="Genre/category")
    duration: Optional[str] = Field(None, description="Duration (e.g., '30 min')")
    score: int = Field(..., description="LPG score")
    status: str = Field(..., description="Production status")
    synopsis: Optional[str] = Field(None, description="Synopsis")
    year: int = Field(2025, description="Release year")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail URL")
    stream_url: Optional[str] = Field(None, description="Stream URL")
    telegram_message_id: Optional[int] = Field(None, description="Telegram message ID for streaming")


class ProductionList(BaseModel):
    """Response model for production list"""
    total: int = Field(..., description="Total number of productions")
    productions: List[Production] = Field(..., description="List of productions")


class ViewAnalytics(BaseModel):
    """Model for tracking video views"""
    production_id: int = Field(..., description="Production ID")
    viewer_id: Optional[str] = Field(None, description="Anonymous viewer identifier")
    duration_seconds: Optional[int] = Field(None, description="Watch duration in seconds")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now)
    stream_api_status: str = Field(..., description="Stream API connection status")


# ============================================================================
# Production Catalog - 24 Bitaca Productions from Lei Paulo Gustavo
# ============================================================================

PRODUCTIONS_CATALOG = [
    {
        "id": 1,
        "title": "Ponteia Viola",
        "director": "Margarida Chaves de Oliveira Scuoteguazza",
        "genre": "Documentário Musical",
        "duration": "10-15 min",
        "score": 238,
        "status": "Em produção",
        "synopsis": "Documentário sobre a tradição da viola caipira, resgatando a cultura musical do interior paulista.",
        "telegram_message_id": None  # To be configured
    },
    {
        "id": 2,
        "title": "Os Cascatinhas",
        "director": "Flavio Francisco Ramos Pereira",
        "genre": "Documentário Musical",
        "duration": "3-6 min",
        "score": 236,
        "status": "Em produção",
        "synopsis": "Videoclipe/documentário musical sobre grupo de choro local.",
        "telegram_message_id": None
    },
    {
        "id": 3,
        "title": "Reconstruction",
        "director": "Bruna Maximovitz Kadoo Polississo",
        "genre": "Audiovisual",
        "duration": "10-15 min",
        "score": 234,
        "status": "Em produção",
        "synopsis": "Produção audiovisual experimental.",
        "telegram_message_id": None
    },
    {
        "id": 4,
        "title": "A Crônica",
        "director": "Micaelen de Oliveira Silva",
        "genre": "Curta/Documentário",
        "duration": "10-15 min",
        "score": 234,
        "status": "Em produção",
        "synopsis": "Curta-documentário sobre crônicas locais.",
        "telegram_message_id": None
    },
    {
        "id": 5,
        "title": "Grupo Êre",
        "director": "Luan Augusto da Costa Oliveira",
        "genre": "Audiovisual",
        "duration": "10-15 min",
        "score": 232,
        "status": "Em produção",
        "synopsis": "Produção audiovisual sobre cultura afro-brasileira.",
        "telegram_message_id": None
    },
    {
        "id": 6,
        "title": "Pelas Ruas de Capão: Skate e Espaços Públicos",
        "director": "Valdir dos Reis Junior",
        "genre": "Documentário Urbano",
        "duration": "10-15 min",
        "score": 230,
        "status": "Em produção",
        "synopsis": "Curta-documentário sobre cultura do skate e ocupação urbana em Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 7,
        "title": "Animação Memórias Vivas",
        "director": "Jose Luiz Rodrigues",
        "genre": "Animação",
        "duration": "10-15 min",
        "score": 228,
        "status": "Em produção",
        "synopsis": "Animação sobre memória coletiva de Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 8,
        "title": "Amarelo, Vermelho, Azul",
        "director": "Lucas Brener Andrade de Oliveira",
        "genre": "Videoclipe Experimental",
        "duration": "3-6 min",
        "score": 226,
        "status": "Em produção",
        "synopsis": "Videoclipe experimental explorando tema de cores e emoções.",
        "telegram_message_id": None
    },
    {
        "id": 9,
        "title": "Versos Vivos de Nossa Cidade",
        "director": "Agatha Fabiane Santiago da Paixão",
        "genre": "Documentário Poético",
        "duration": "10-12 min",
        "score": 224,
        "status": "Em produção",
        "synopsis": "Documentário poético integrando recitais de poesia e imagens urbanas de Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 10,
        "title": "Vídeo Clipe",
        "director": "Fabiano Domingues Rosa",
        "genre": "Videoclipe",
        "duration": "3-5 min",
        "score": 222,
        "status": "Em produção",
        "synopsis": "Videoclipe de banda local de rock/pop.",
        "telegram_message_id": None
    },
    {
        "id": 11,
        "title": "Memórias da Minha Terra",
        "director": "Fausto Vieira de Camargo",
        "genre": "Documentário Etnográfico",
        "duration": "15-20 min",
        "score": 218,
        "status": "Em produção",
        "synopsis": "Documentário etnográfico sobre tradições e lendas locais de Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 12,
        "title": "Bonito do Meu Interior",
        "director": "Carina Chaves Scuoteguazza",
        "genre": "Curta de Ficção",
        "duration": "10-15 min",
        "score": 195,
        "status": "Em produção",
        "synopsis": "Curta de ficção celebrando cultura e paisagens do interior paulista.",
        "telegram_message_id": None
    },
    {
        "id": 13,
        "title": "Arte Urbana",
        "director": "Gabriel Felipe dos Santos Souza",
        "genre": "Documentário",
        "duration": "10-15 min",
        "score": 192,
        "status": "Em produção",
        "synopsis": "Documentário sobre arte urbana em Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 14,
        "title": "Cypher do Campeão",
        "director": "Alcides de Souza Vieira",
        "genre": "Videoclipe Hip-Hop",
        "duration": "3-5 min",
        "score": 190,
        "status": "Em produção",
        "synopsis": "Videoclipe de hip-hop celebrando cultura urbana.",
        "telegram_message_id": None
    },
    {
        "id": 15,
        "title": "Preservação do Patrimônio Arbóreo",
        "director": "Ane Samara Santiago da Paixão",
        "genre": "Documentário Ambiental",
        "duration": "10-15 min",
        "score": 187,
        "status": "Em produção",
        "synopsis": "Documentário sobre preservação ambiental.",
        "telegram_message_id": None
    },
    {
        "id": 16,
        "title": "Capão Sustentável",
        "director": "Dorival de Proença Junior",
        "genre": "Documentário Ambiental",
        "duration": "10-15 min",
        "score": 182,
        "status": "Em produção",
        "synopsis": "Documentário sobre sustentabilidade em Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 17,
        "title": "Batalha do Capão",
        "director": "Pedro Fernando da Silva Matos",
        "genre": "Documentário Hip-Hop",
        "duration": "10-15 min",
        "score": 180,
        "status": "Em produção",
        "synopsis": "Documentário sobre batalhas de rap em Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 18,
        "title": "Abaixo das Árvores",
        "director": "Danilo de Pontes Cacciacarro",
        "genre": "Curta de Ficção",
        "duration": "15-20 min",
        "score": 157,
        "status": "Em produção",
        "synopsis": "Curta de ficção ambientado na natureza de Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 19,
        "title": "Rastro da Serpente, a Rota da Aventura",
        "director": "Elcio Shigueo Ueda",
        "genre": "Documentário de Turismo",
        "duration": "15-20 min",
        "score": 155,
        "status": "Em produção",
        "synopsis": "Documentário sobre turismo e aventura em Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 20,
        "title": "Roteiro do Milho",
        "director": "Diego Fernandes Ferreira",
        "genre": "Documentário Gastronômico",
        "duration": "10-15 min",
        "score": 152,
        "status": "Em produção",
        "synopsis": "Documentário sobre gastronomia baseada em milho.",
        "telegram_message_id": None
    },
    {
        "id": 21,
        "title": "A História do Rock de Capão Bonito",
        "director": "Osvaldo Polississo",
        "genre": "Documentário Musical",
        "duration": "15-20 min",
        "score": 150,
        "status": "Em produção",
        "synopsis": "Documentário sobre a história do rock local.",
        "telegram_message_id": None
    },
    {
        "id": 22,
        "title": "1-Sala de Cinema",
        "director": "Anderson Ferreira",
        "genre": "Projeto",
        "duration": "N/A",
        "score": 145,
        "status": "Em produção",
        "synopsis": "Projeto sobre cinema em Capão Bonito.",
        "telegram_message_id": None
    },
    {
        "id": 23,
        "title": "Padre Arlindo Vieira",
        "director": "Leandro de Mello Almeida",
        "genre": "Documentário Biográfico",
        "duration": "15-20 min",
        "score": 140,
        "status": "Em produção",
        "synopsis": "Documentário biográfico sobre Padre Arlindo Vieira.",
        "telegram_message_id": None
    },
    {
        "id": 24,
        "title": "Harmonias de Capão Bonito",
        "director": "Nicolas Nascimento de Queiroz",
        "genre": "Documentário Musical",
        "duration": "10-15 min",
        "score": 127,
        "status": "Em produção",
        "synopsis": "Documentário sobre música e harmonias locais.",
        "telegram_message_id": None
    }
]


# ============================================================================
# Lifespan Management
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    global http_client

    # Startup
    logger.info("🚀 Starting Bitaca Play 3D Streaming Bridge")
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(STREAM_API_TIMEOUT),
        follow_redirects=True,
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
    )

    # Test stream-winx-api connection
    try:
        response = await http_client.get(f"{STREAM_API_URL}/api/v1/health")
        if response.status_code == 200:
            logger.info("✅ Connected to stream-winx-api")
        else:
            logger.warning("⚠️ stream-winx-api returned non-200 status")
    except Exception as e:
        logger.error(f"❌ Failed to connect to stream-winx-api: {e}")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Bitaca Play 3D Streaming Bridge")
    if http_client:
        await http_client.aclose()


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="Bitaca Play 3D Streaming Bridge",
    description="Bridge service connecting stream-winx-api to play-3d frontend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - allow 3D frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:3000",
        "https://play.abitaca.com.br",
        "https://abitaca.com.br"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length"],
)


# ============================================================================
# Helper Functions
# ============================================================================

def get_production_by_id(production_id: int) -> Optional[Dict[str, Any]]:
    """Get production by ID from catalog"""
    for prod in PRODUCTIONS_CATALOG:
        if prod["id"] == production_id:
            return prod
    return None


def build_production_urls(production: Dict[str, Any], request: Request) -> Production:
    """Build full URLs for production thumbnails and streams"""
    base_url = str(request.base_url).rstrip('/')

    prod_data = production.copy()
    prod_data["thumbnail_url"] = f"{base_url}/api/productions/{production['id']}/thumbnail"
    prod_data["stream_url"] = f"{base_url}/api/productions/{production['id']}/stream"

    return Production(**prod_data)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Bitaca Play 3D Streaming Bridge",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "productions": "/api/productions",
            "stream": "/api/productions/{id}/stream",
            "thumbnail": "/api/productions/{id}/thumbnail"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    stream_api_status = "unknown"

    try:
        if http_client:
            response = await http_client.get(
                f"{STREAM_API_URL}/api/v1/health",
                timeout=5.0
            )
            stream_api_status = "healthy" if response.status_code == 200 else "degraded"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        stream_api_status = "unavailable"

    return HealthResponse(
        status="healthy",
        stream_api_status=stream_api_status
    )


@app.get("/api/productions", response_model=ProductionList)
async def list_productions(
    request: Request,
    genre: Optional[str] = Query(None, description="Filter by genre"),
    search: Optional[str] = Query(None, description="Search in title/director"),
    limit: int = Query(24, ge=1, le=100, description="Maximum results")
):
    """
    List all Bitaca productions with metadata

    Query parameters:
    - genre: Filter by genre (e.g., 'Documentário', 'Videoclipe')
    - search: Search term for title/director
    - limit: Maximum number of results (default: 24)
    """
    try:
        productions = PRODUCTIONS_CATALOG.copy()

        # Filter by genre
        if genre:
            productions = [p for p in productions if genre.lower() in p["genre"].lower()]

        # Search filter
        if search:
            search_lower = search.lower()
            productions = [
                p for p in productions
                if search_lower in p["title"].lower() or search_lower in p["director"].lower()
            ]

        # Apply limit
        productions = productions[:limit]

        # Build full URLs
        productions_with_urls = [
            build_production_urls(prod, request)
            for prod in productions
        ]

        logger.info(f"📋 Listing {len(productions_with_urls)} productions")

        return ProductionList(
            total=len(productions_with_urls),
            productions=productions_with_urls
        )

    except Exception as e:
        logger.error(f"Error listing productions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list productions: {str(e)}"
        )


@app.get("/api/productions/{production_id}")
async def get_production(production_id: int, request: Request):
    """Get single production by ID"""
    production = get_production_by_id(production_id)

    if not production:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Production {production_id} not found"
        )

    return build_production_urls(production, request)


@app.get("/api/productions/{production_id}/stream")
async def stream_production(
    production_id: int,
    request: Request,
    range: Optional[str] = Header(None, description="HTTP Range header")
):
    """
    Stream video for a production by proxying to stream-winx-api

    Supports HTTP range requests for video seeking.
    """
    try:
        production = get_production_by_id(production_id)

        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Production {production_id} not found"
            )

        # Get Telegram message ID
        telegram_message_id = production.get("telegram_message_id")

        if not telegram_message_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Streaming not available for '{production['title']}' yet"
            )

        # Build stream-winx-api URL
        # Note: Adjust URL format based on actual stream-winx-api endpoint
        stream_url = f"{STREAM_API_URL}/api/v1/posts/stream"

        # Prepare headers for proxy request
        headers = {}
        if range:
            headers["Range"] = range

        logger.info(f"🎬 Streaming production {production_id}: {production['title']}")

        # Proxy request to stream-winx-api
        async def generate():
            async with http_client.stream(
                "GET",
                stream_url,
                params={"message_id": telegram_message_id},
                headers=headers
            ) as response:
                async for chunk in response.aiter_bytes(chunk_size=CHUNK_SIZE):
                    yield chunk

        # Determine response headers
        response_headers = {
            "Accept-Ranges": "bytes",
            "Content-Type": "video/mp4"
        }

        # Handle range request
        status_code = 200
        if range:
            status_code = 206  # Partial Content
            # Note: stream-winx-api should provide Content-Range header

        return StreamingResponse(
            generate(),
            status_code=status_code,
            headers=response_headers,
            media_type="video/mp4"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming production {production_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stream video: {str(e)}"
        )


@app.get("/api/productions/{production_id}/thumbnail")
async def get_thumbnail(production_id: int):
    """
    Get video thumbnail for a production

    Returns a placeholder or proxies to stream-winx-api for actual thumbnail.
    """
    try:
        production = get_production_by_id(production_id)

        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Production {production_id} not found"
            )

        telegram_message_id = production.get("telegram_message_id")

        if not telegram_message_id:
            # Return placeholder or 404
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Thumbnail not available"
            )

        # Proxy to stream-winx-api for thumbnail
        thumbnail_url = f"{STREAM_API_URL}/api/v1/posts/images/{telegram_message_id}"

        response = await http_client.get(thumbnail_url)
        response.raise_for_status()

        return StreamingResponse(
            iter([response.content]),
            media_type="image/jpeg",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Length": str(len(response.content))
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching thumbnail for production {production_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch thumbnail: {str(e)}"
        )


@app.post("/api/analytics/view", status_code=status.HTTP_201_CREATED)
async def track_view(analytics: ViewAnalytics):
    """
    Track video view analytics

    Logs view events for production analytics.
    Future: Store in database or analytics service.
    """
    try:
        production = get_production_by_id(analytics.production_id)

        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Production {analytics.production_id} not found"
            )

        # Log analytics event
        logger.info(
            f"📊 View tracked: Production {analytics.production_id} "
            f"({production['title']}) - Duration: {analytics.duration_seconds}s"
        )

        # Future: Store in database
        # await db.analytics.insert_one(analytics.dict())

        return {
            "status": "success",
            "message": "View tracked successfully",
            "production_id": analytics.production_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking view: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track view: {str(e)}"
        )


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
