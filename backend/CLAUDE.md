# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bitaca Cinema is a FastAPI-based chatbot backend for a cultural cinema project in Capão Bonito/SP, Brazil. It uses NVIDIA NIM for LLM capabilities and implements a multi-agent AI system (Agno framework) for specialized responses about cinema productions and Brazilian cultural laws.

## Key Architecture Components

### Multi-Agent System (AGI)
- **AgentManager** (`agents/agent_manager.py`): Orchestrates three specialized agents
  - **CinemaAgent**: Handles production details, directors, themes
  - **CulturalAgent**: Expertise in Brazilian cultural laws (Paulo Gustavo, Aldir Blanc, PNAB)
  - **DiscoveryAgent**: RAG-based semantic search and recommendations using embeddings

### Core Services
- **FastAPI Application** (`main.py`): Main API server with SSE streaming support
- **MongoDB Integration** (`database.py`): Optional persistence for conversations and analytics
- **R2 Storage** (`r2_storage.py`): Cloudflare R2 for video storage with presigned URLs
- **Rate Limiting**: Dual-layer protection (Nginx + FastAPI) - 60 req/min per IP

### Deployment Architecture
```
Cloudflare → Nginx (Docker) → FastAPI (4 workers) → NVIDIA NIM API
```

## Common Development Commands

### Local Development
```bash
# Setup virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server with hot reload
uvicorn main:app --reload --port 3000

# Run production server
uvicorn main:app --host 0.0.0.0 --port 3000 --workers 4
```

### Docker Operations
```bash
# Build and start containers
make build && make up

# View logs
make logs          # All logs
make logs ARGS="api"  # API logs only

# Restart services
make restart

# Stop services
make down

# Clean everything
make clean
```

### Deployment
```bash
# Deploy to production (requires SSH key setup)
make deploy-ci

# Deploy with password
export SERVER_PASSWORD='your-password'
make deploy

# Quick file update (no rebuild)
make deploy-files

# Remote operations
make remote-logs     # View production logs
make remote-ps       # Check container status
make remote-restart  # Restart production
make health-remote   # Health check
```

### Testing API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Chat completion (non-streaming)
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Olá"}],"stream":false}'

# AGI chat endpoint
curl -X POST http://localhost:3000/api/agi/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Buscar filmes sobre meio ambiente"}'

# Test production API
make test-remote
```

## Environment Configuration

Required environment variables (see `.env.example`):
- `NVIDIA_API_KEY`: NVIDIA NIM API key (required)
- `NVIDIA_MODEL`: Default LLM model (qwen/qwen3-next-80b-a3b-thinking)
- `MONGODB_URI`: MongoDB connection string (optional)
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`: Cloudflare R2 credentials (optional)
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)
- `RATE_LIMIT_PER_MINUTE`: Rate limit per IP (default: 60)

## API Endpoints

### Core Endpoints
- `GET /health` - Health check with system info
- `POST /api/chat/completions` - NVIDIA NIM chat proxy with SSE streaming
- `POST /api/embeddings` - Generate text embeddings with caching

### AGI System Endpoints
- `POST /api/agi/chat` - Multi-agent chat with intent routing
- `POST /api/agi/recommend` - Get similar production recommendations
- `GET /api/agi/info` - System capabilities and agent info
- `GET /api/agi/health` - Agent system health check

### Storage Endpoints (R2)
- `POST /api/upload/presigned-url` - Get presigned URL for video upload
- `GET /api/videos` - List uploaded videos
- `DELETE /api/videos/{file_key}` - Delete a video

## Project Structure

```
backend/
├── main.py              # FastAPI application and endpoints
├── database.py          # MongoDB models and operations
├── r2_storage.py        # Cloudflare R2 integration
├── agents/              # Multi-agent system
│   ├── agent_manager.py # Orchestration layer
│   ├── cinema_agent.py  # Cinema expertise agent
│   ├── cultural_agent.py # Cultural law agent
│   ├── discovery_agent.py # RAG search agent
│   └── tools/           # Agent tools (RAG, etc.)
├── embeddings.json      # Pre-computed production embeddings
├── Docker setup
│   ├── Dockerfile       # Python 3.12 + FastAPI
│   ├── docker-compose.yml # API + Nginx services
│   └── nginx/           # Nginx configuration
└── Makefile            # Development and deployment commands
```

## Key Technical Decisions

1. **Multi-Agent Architecture**: Uses Agno framework for specialized knowledge domains - each agent has specific expertise and appropriate LLM model selection

2. **Dual Rate Limiting**: Both Nginx (100 req/min global) and FastAPI (60 req/min per IP) for robust protection

3. **Optional MongoDB**: Database features gracefully degrade if MongoDB is not configured, making deployment flexible

4. **SSE Streaming**: Real-time responses with proper buffering disabled for smooth streaming through proxies

5. **Embeddings Cache**: Pre-computed embeddings for all cinema productions stored in `embeddings.json` for fast semantic search

6. **Docker Deployment**: Production runs in Docker with health checks, auto-restart, and proper logging

## Production Server

- **Server**: 162.12.204.30 (Ubuntu 24.04 LTS)
- **Domain**: api.abitaca.com.br
- **Deploy Path**: /opt/bitaca-cinema
- **SSL**: Managed by Cloudflare (Flexible SSL mode)
- **Access**: SSH with key or password