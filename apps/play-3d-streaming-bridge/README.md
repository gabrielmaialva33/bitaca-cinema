# Bitaca Play 3D Streaming Bridge

FastAPI bridge service connecting **stream-winx-api** (Telegram video streaming backend) to **play-3d** frontend (
Three.js 3D cinema interface).

## Features

- **CORS Support** - Properly configured for 3D frontend access
- **Production Catalog** - Manages metadata for 24 Bitaca audiovisual productions
- **Video Streaming Proxy** - HTTP range request support for video seeking
- **Thumbnail Service** - Proxy for video thumbnails from Telegram
- **Analytics Tracking** - View tracking and analytics endpoints
- **Health Checks** - Monitor service and upstream API status
- **Error Handling** - Comprehensive error handling and logging
- **Async/Await** - Fully asynchronous for high performance

## Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│   Play 3D       │─────▶│  Streaming Bridge    │─────▶│  stream-winx    │
│   Frontend      │      │  (This Service)      │      │  Telegram API   │
│   (Three.js)    │◀─────│  FastAPI + httpx     │◀─────│  (Telethon)     │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Productions Catalog │
                         │  (24 Bitaca Films)   │
                         └──────────────────────┘
```

## Quick Start

### 1. Installation

```bash
cd /Users/gabrielmaia/Documents/projects/bitaca-cinema/apps/play-3d-streaming-bridge

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Key settings:**

- `STREAM_API_URL` - URL of stream-winx-api (default: http://localhost:8000)
- `PORT` - Bridge service port (default: 8001)
- `CORS_ORIGINS` - Allowed origins for CORS

### 3. Start Stream-Winx-API

Ensure stream-winx-api is running first:

```bash
cd /Users/gabrielmaia/Documents/projects/bitaca-cinema/tmp/stream-winx-api

# Install dependencies (if not done)
poetry install

# Configure .env with Telegram credentials
cp .env.example .env
# Edit .env with API_ID, API_HASH, BOT_TOKEN, etc.

# Run
poetry run python main.py
```

stream-winx-api should be running on **http://localhost:8000**

### 4. Start Bridge Service

```bash
# Development mode (with auto-reload)
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Bridge service will be available at **http://localhost:8001**

### 5. Access API Documentation

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-13T15:30:00Z",
  "stream_api_status": "healthy"
}
```

### List Productions

```http
GET /api/productions
```

**Query Parameters:**

- `genre` - Filter by genre (e.g., "Documentário", "Videoclipe")
- `search` - Search in title/director
- `limit` - Maximum results (default: 24)

**Response:**

```json
{
  "total": 24,
  "productions": [
    {
      "id": 1,
      "title": "Ponteia Viola",
      "director": "Margarida Chaves de Oliveira Scuoteguazza",
      "genre": "Documentário Musical",
      "duration": "10-15 min",
      "score": 238,
      "status": "Em produção",
      "synopsis": "Documentário sobre a tradição da viola caipira...",
      "year": 2025,
      "thumbnail_url": "http://localhost:8001/api/productions/1/thumbnail",
      "stream_url": "http://localhost:8001/api/productions/1/stream",
      "telegram_message_id": null
    }
  ]
}
```

### Get Single Production

```http
GET /api/productions/{id}
```

**Response:** Single `Production` object

### Stream Video

```http
GET /api/productions/{id}/stream
```

**Headers:**

- `Range: bytes=0-1023` - Optional for seeking/partial content

**Response:**

- Status: 200 (full content) or 206 (partial content)
- Content-Type: video/mp4
- Body: Video stream

**Example with curl:**

```bash
# Full video
curl http://localhost:8001/api/productions/1/stream -o video.mp4

# Range request (first 1MB)
curl -H "Range: bytes=0-1048576" \
  http://localhost:8001/api/productions/1/stream \
  -o video_chunk.mp4
```

### Get Thumbnail

```http
GET /api/productions/{id}/thumbnail
```

**Response:**

- Content-Type: image/jpeg
- Body: JPEG image

### Track View Analytics

```http
POST /api/analytics/view
```

**Request Body:**

```json
{
  "production_id": 1,
  "viewer_id": "anonymous-uuid",
  "duration_seconds": 120,
  "timestamp": "2025-10-13T15:30:00Z"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "View tracked successfully",
  "production_id": 1
}
```

## Integration with Play 3D Frontend

### Update Frontend API Client

Edit `/apps/play-3d/assets/js/utils/api-client.js`:

```javascript
class BitacaAPIClient {
    constructor() {
        // Point to streaming bridge
        this.streamBridgeURL = window.location.hostname === 'localhost'
            ? 'http://localhost:8001'
            : 'https://stream-bridge.abitaca.com.br';
    }

    async getProductions() {
        const response = await fetch(`${this.streamBridgeURL}/api/productions`);
        return await response.json();
    }

    getStreamURL(productionId) {
        return `${this.streamBridgeURL}/api/productions/${productionId}/stream`;
    }

    getThumbnailURL(productionId) {
        return `${this.streamBridgeURL}/api/productions/${productionId}/thumbnail`;
    }

    async trackView(productionId, durationSeconds) {
        await fetch(`${this.streamBridgeURL}/api/analytics/view`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                production_id: productionId,
                duration_seconds: durationSeconds
            })
        });
    }
}
```

### Load Productions in 3D Scene

```javascript
// In patrimonio-world.js or similar
async function loadBitacaProductions() {
    const response = await window.bitacaAPI.getProductions();
    const productions = response.productions;

    productions.forEach((prod, index) => {
        // Create 3D poster in cinema
        createPoster3D(
            prod.title,
            prod.thumbnail_url,
            prod.stream_url,
            index
        );
    });
}
```

## Production Catalog

The service includes metadata for **24 audiovisual productions** from Lei Paulo Gustavo:

| ID  | Title          | Director               | Genre                | Score |
|-----|----------------|------------------------|----------------------|-------|
| 1   | Ponteia Viola  | Margarida Scuoteguazza | Documentário Musical | 238   |
| 2   | Os Cascatinhas | Flavio Ramos Pereira   | Documentário Musical | 236   |
| 3   | Reconstruction | Bruna Polississo       | Audiovisual          | 234   |
| ... | ...            | ...                    | ...                  | ...   |

**Note:** `telegram_message_id` must be configured for each production to enable streaming.

### Configuring Telegram Message IDs

Edit `main.py` and update the `PRODUCTIONS_CATALOG` with actual Telegram message IDs:

```python
{
    "id": 1,
    "title": "Ponteia Viola",
    # ... other fields ...
    "telegram_message_id": 12345  # Replace with actual message ID from Telegram channel
}
```

Get message IDs from stream-winx-api or directly from Telegram channel messages.

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:8001/health

# List productions
curl http://localhost:8001/api/productions

# Get single production
curl http://localhost:8001/api/productions/1

# Track view
curl -X POST http://localhost:8001/api/analytics/view \
  -H "Content-Type: application/json" \
  -d '{"production_id": 1, "duration_seconds": 60}'
```

### Automated Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx-mock

# Run tests (when test suite is created)
pytest tests/
```

## Deployment

### Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build and run:

```bash
docker build -t bitaca-streaming-bridge .
docker run -p 8001:8001 --env-file .env bitaca-streaming-bridge
```

### Production with Gunicorn

```bash
pip install gunicorn

gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001 \
  --log-level info
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name stream-bridge.abitaca.com.br;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Important for streaming
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

## Performance Optimization

### Caching with Redis

Uncomment Redis dependencies in `requirements.txt`:

```python
# In main.py, add caching
import redis.asyncio as redis

cache = await redis.from_url(settings.redis_url)

@app.get("/api/productions")
async def list_productions(...):
    # Check cache
    cached = await cache.get("productions")
    if cached:
        return json.loads(cached)

    # Fetch and cache
    result = # ... fetch productions ...
    await cache.setex("productions", settings.cache_ttl, json.dumps(result))
    return result
```

### Rate Limiting

Add rate limiting with SlowAPI:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/productions")
@limiter.limit("30/minute")
async def list_productions(request: Request, ...):
    ...
```

## Monitoring

### Logging

All requests are logged with timestamps and details:

```
2025-10-13 15:30:00 - INFO - 🚀 Starting Bitaca Play 3D Streaming Bridge
2025-10-13 15:30:01 - INFO - ✅ Connected to stream-winx-api
2025-10-13 15:30:15 - INFO - 📋 Listing 24 productions
2025-10-13 15:30:30 - INFO - 🎬 Streaming production 1: Ponteia Viola
```

### Health Monitoring

Use `/health` endpoint for uptime monitoring:

```bash
# Check every minute
*/1 * * * * curl -f http://localhost:8001/health || alert "Bridge down!"
```

## Troubleshooting

### Bridge can't connect to stream-winx-api

**Symptoms:** Health check shows `stream_api_status: "unavailable"`

**Solutions:**

1. Verify stream-winx-api is running: `curl http://localhost:8000/api/v1/health`
2. Check `STREAM_API_URL` in `.env`
3. Check firewall rules if running on different machines

### CORS errors in browser

**Symptoms:** Browser console shows CORS policy errors

**Solutions:**

1. Add your frontend URL to `CORS_ORIGINS` in `.env`
2. Restart bridge service after updating `.env`
3. Check browser DevTools Network tab for exact error

### Video doesn't stream

**Symptoms:** 503 error "Streaming not available"

**Solutions:**

1. Configure `telegram_message_id` in production catalog
2. Verify Telegram message exists in stream-winx-api
3. Check stream-winx-api logs for errors

### Thumbnail returns 404

**Symptom:** Thumbnail endpoint returns 404

**Solutions:**

1. Configure `telegram_message_id` for the production
2. Verify image exists in Telegram channel
3. Check stream-winx-api `/api/v1/posts/images/{message_id}` endpoint

## Contributing

1. Follow Python PEP 8 style guide
2. Add type hints to all functions
3. Write docstrings for public APIs
4. Add error handling with proper logging
5. Update README for new features

## License

MIT License - See main project LICENSE file

## Contact

Bitaca Cinema Team

- Email: cultura@capaobonito.sp.gov.br
- GitHub: abitaca/bitaca-cinema

## Related Projects

- **stream-winx-api**: `/tmp/stream-winx-api` - Telegram streaming backend
- **play-3d**: `/apps/play-3d` - Three.js 3D cinema frontend
- **backend**: `/apps/backend` - Main Bitaca backend (FastAPI + Gemini AI)
- **frontend**: `/apps/frontend` - Main Bitaca website

---

**Last Updated:** October 13, 2025
