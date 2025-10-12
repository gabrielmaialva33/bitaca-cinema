"""
Bitaca Cinema - Chatbot Backend API
Powered by Agno + FastAPI + NVIDIA NIM
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()

# MongoDB integration
try:
    from database import (
        get_mongo_client, close_mongo_connection, init_indexes,
        ConversationDB, AnalyticsDB, EmbeddingsCacheDB
    )
    MONGODB_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  MongoDB not available: {e}")
    MONGODB_AVAILABLE = False

# Configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_API_URL = os.getenv("NVIDIA_API_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "qwen/qwen3-next-80b-a3b-thinking")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", 60))


# Pydantic models
class Message(BaseModel):
    role: str = Field(..., description="Role: user, assistant, or system")
    content: str = Field(..., description="Message content")


class ChatCompletionRequest(BaseModel):
    messages: List[Message] = Field(..., description="Conversation messages")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(500, ge=1, le=4096)
    top_p: float = Field(0.9, ge=0.0, le=1.0)
    stream: bool = Field(True, description="Enable streaming")


class EmbeddingRequest(BaseModel):
    input: str = Field(..., description="Text to embed")
    model: str = Field("nvidia/nv-embedqa-e5-v5", description="Embedding model")
    input_type: str = Field("passage", description="Input type: query or passage")


class HealthResponse(BaseModel):
    status: str
    version: str
    model: str
    uptime: float


# Rate limiting store (simple in-memory)
rate_limit_store: Dict[str, List[float]] = {}


def check_rate_limit(client_ip: str) -> bool:
    """Simple rate limiting by IP"""
    now = asyncio.get_event_loop().time()
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = []

    # Remove old timestamps (older than 1 minute)
    rate_limit_store[client_ip] = [
        ts for ts in rate_limit_store[client_ip]
        if now - ts < 60
    ]

    # Check if limit exceeded
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        return False

    # Add new timestamp
    rate_limit_store[client_ip].append(now)
    return True


# Startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 Starting Bitaca Cinema API...")
    print(f"📡 NVIDIA Model: {NVIDIA_MODEL}")
    print(f"🔑 API Key: {NVIDIA_API_KEY[:20]}...")
    print(f"🌍 Allowed Origins: {ALLOWED_ORIGINS}")

    # Initialize MongoDB
    if MONGODB_AVAILABLE:
        try:
            get_mongo_client()
            init_indexes()
            print("✅ MongoDB initialized successfully")
        except Exception as e:
            print(f"⚠️  MongoDB initialization failed: {e}")

    yield

    # Cleanup
    print("🛑 Shutting down Bitaca Cinema API...")
    if MONGODB_AVAILABLE:
        try:
            close_mongo_connection()
        except Exception as e:
            print(f"⚠️  MongoDB cleanup error: {e}")


# Create FastAPI app
app = FastAPI(
    title="Bitaca Cinema Chatbot API",
    description="Backend proxy for NVIDIA NIM chat completions with streaming",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Bitaca Cinema Chatbot API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    import time
    return HealthResponse(
        status="ok",
        version="1.0.0",
        model=NVIDIA_MODEL,
        uptime=time.time()
    )


@app.post("/api/chat/completions")
async def chat_completions(request: ChatCompletionRequest, req: Request):
    """
    Chat completions endpoint with streaming support
    """
    # Rate limiting
    client_ip = req.client.host
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again in 1 minute."
        )

    # Prepare request for NVIDIA API
    messages_dict = [msg.dict() for msg in request.messages]

    payload = {
        "model": NVIDIA_MODEL,
        "messages": messages_dict,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "top_p": request.top_p,
        "stream": request.stream,
    }

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }

    if request.stream:
        # Streaming response with SSE
        async def event_generator():
            async with httpx.AsyncClient(timeout=120.0) as client:
                try:
                    async with client.stream(
                        "POST",
                        f"{NVIDIA_API_URL}/chat/completions",
                        headers=headers,
                        json=payload,
                    ) as response:
                        if response.status_code != 200:
                            error_text = await response.aread()
                            yield f"data: {json.dumps({'error': error_text.decode()})}\n\n"
                            return

                        async for line in response.aiter_lines():
                            if line.strip():
                                if line.startswith("data: "):
                                    # Forward SSE data
                                    yield f"{line}\n\n"
                                elif line == "data: [DONE]":
                                    yield "data: [DONE]\n\n"
                                    break

                except Exception as e:
                    print(f"❌ Streaming error: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable Nginx buffering
            },
        )

    else:
        # Non-streaming response
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    f"{NVIDIA_API_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=response.text
                    )

                return JSONResponse(content=response.json())

            except httpx.RequestError as e:
                raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/embeddings")
async def generate_embeddings(request: EmbeddingRequest, req: Request):
    """
    Generate embeddings using NVIDIA API with MongoDB caching
    """
    # Rate limiting
    client_ip = req.client.host
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again in 1 minute."
        )

    # Check cache first (only for query type)
    if MONGODB_AVAILABLE and request.input_type == "query":
        try:
            cached = EmbeddingsCacheDB.get_cached_embedding(request.input, request.model)
            if cached:
                print(f"✅ Cache hit for query: {request.input[:50]}...")
                return JSONResponse(content={
                    "data": [{"embedding": cached}],
                    "model": request.model,
                    "usage": {"total_tokens": 0}
                })
        except Exception as e:
            print(f"⚠️  Cache lookup failed: {e}")

    payload = {
        "model": request.model,
        "input": request.input,
        "input_type": request.input_type,
        "encoding_format": "float",
    }

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{NVIDIA_API_URL}/embeddings",
                headers=headers,
                json=payload,
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )

            result = response.json()

            # Cache the embedding (only for query type)
            if MONGODB_AVAILABLE and request.input_type == "query" and "data" in result:
                try:
                    embedding = result["data"][0]["embedding"]
                    EmbeddingsCacheDB.cache_embedding(request.input, request.model, embedding)
                    print(f"✅ Cached query: {request.input[:50]}...")
                except Exception as e:
                    print(f"⚠️  Cache write failed: {e}")

            return JSONResponse(content=result)

        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    print(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 3000))
    workers = int(os.getenv("WORKERS", 4))
    reload = os.getenv("RELOAD", "false").lower() == "true"

    print(f"🚀 Starting server on {host}:{port}")
    print(f"👷 Workers: {workers}")
    print(f"🔄 Reload: {reload}")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers if not reload else 1,
        reload=reload,
        log_level="info",
    )