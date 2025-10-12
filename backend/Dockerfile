# Bitaca Cinema API - Dockerfile
# Python 3.12 + FastAPI + NVIDIA NIM

FROM python:3.12-slim-bookworm

# Metadata
LABEL maintainer="Gabriel Maia <gabriel@abitaca.com.br>"
LABEL description="Bitaca Cinema Chatbot API with NVIDIA NIM"
LABEL version="1.0.0"

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app user (non-root)
RUN useradd -m -u 1000 -s /bin/bash app

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY database.py .
COPY r2_storage.py .
COPY agents/ ./agents/
COPY embeddings.json ./embeddings.json
COPY .env.example .env

# Change ownership to app user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000", "--workers", "4"]