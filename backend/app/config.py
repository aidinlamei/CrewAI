"""
Configuration settings for the CrewAI Manager application.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
import secrets


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "CrewAI Manager"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database - MUST be set via environment variable in production
    DATABASE_URL: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security - MUST be set via environment variables in production
    SECRET_KEY: str = ""
    ENCRYPTION_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # LLM Providers (Optional - can be configured via UI)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Generate random keys if not set (development only)
        if not self.SECRET_KEY:
            if self.ENVIRONMENT == "production":
                raise ValueError(
                    "SECRET_KEY must be set in production! "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
            else:
                # Auto-generate for development
                self.SECRET_KEY = secrets.token_urlsafe(32)
                print("⚠️  WARNING: Using auto-generated SECRET_KEY for development")

        if not self.ENCRYPTION_KEY:
            if self.ENVIRONMENT == "production":
                raise ValueError(
                    "ENCRYPTION_KEY must be set in production! "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
            else:
                # Auto-generate for development
                self.ENCRYPTION_KEY = secrets.token_urlsafe(32)
                print("⚠️  WARNING: Using auto-generated ENCRYPTION_KEY for development")

        if not self.DATABASE_URL:
            if self.ENVIRONMENT == "production":
                raise ValueError(
                    "DATABASE_URL must be set in production! "
                    "Set it in .env or environment variables (e.g., postgresql://user:pass@host:5432/dbname)"
                )
            else:
                # Use default for development
                self.DATABASE_URL = "postgresql://crewai:crewai123@localhost:5432/crewai_db"
                print("⚠️  WARNING: Using default DATABASE_URL for development")

        # Validate CORS origins in production
        if self.ENVIRONMENT == "production":
            if "*" in self.CORS_ORIGINS:
                raise ValueError(
                    "CORS_ORIGINS cannot contain wildcards (*) in production! "
                    "Set specific allowed origins in environment variables."
                )
            if not self.CORS_ORIGINS:
                raise ValueError(
                    "CORS_ORIGINS must be set in production! "
                    "Set allowed origins in environment variables (e.g., ['https://example.com'])."
                )


settings = Settings()
