"""
Configuration management for Bitaca Play 3D Streaming Bridge
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    app_name: str = Field(
        default="Bitaca Play 3D Streaming Bridge",
        description="Application name"
    )
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")

    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8001, description="Server port")
    reload: bool = Field(default=False, description="Auto-reload on code changes")

    # Stream API
    stream_api_url: str = Field(
        default="http://localhost:8000",
        description="Base URL for stream-winx-api"
    )
    stream_api_timeout: float = Field(
        default=30.0,
        description="Timeout for stream-winx-api requests (seconds)"
    )
    stream_api_max_retries: int = Field(
        default=3,
        description="Maximum retries for stream-winx-api requests"
    )

    # CORS
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:8080",
            "http://localhost:3000",
            "https://play.abitaca.com.br",
            "https://abitaca.com.br"
        ],
        description="Allowed CORS origins"
    )

    # Streaming
    chunk_size: int = Field(
        default=1024 * 1024,  # 1MB
        description="Chunk size for video streaming (bytes)"
    )

    # Cache (Optional - Redis)
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    cache_ttl: int = Field(
        default=3600,
        description="Cache TTL in seconds (1 hour)"
    )

    # Rate Limiting (Optional)
    rate_limit_enabled: bool = Field(
        default=False,
        description="Enable rate limiting"
    )
    rate_limit_per_minute: int = Field(
        default=60,
        description="Maximum requests per minute per IP"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
