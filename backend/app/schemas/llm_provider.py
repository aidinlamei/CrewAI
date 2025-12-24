"""
LLM Provider schemas.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import BaseSchema


class LLMProviderBase(BaseModel):
    """Base LLM provider schema."""

    name: str = Field(..., min_length=1, max_length=100)
    display_name: Optional[str] = None
    api_key: Optional[str] = None  # Not encrypted in schema
    api_base_url: Optional[str] = None
    available_models: Optional[List[str]] = []
    default_model: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}
    is_active: bool = True


class LLMProviderCreate(LLMProviderBase):
    """LLM provider creation schema."""

    pass


class LLMProviderUpdate(BaseModel):
    """LLM provider update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_name: Optional[str] = None
    api_key: Optional[str] = None
    api_base_url: Optional[str] = None
    available_models: Optional[List[str]] = None
    default_model: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class LLMProviderResponse(BaseSchema):
    """LLM provider response schema (without API key)."""

    id: UUID
    name: str
    display_name: Optional[str]
    api_base_url: Optional[str]
    available_models: List[str]
    default_model: Optional[str]
    config: Dict[str, Any]
    is_active: bool
    last_tested_at: Optional[datetime]
    created_at: datetime
    has_api_key: bool = False  # Indicates if API key is set


class LLMProviderTestRequest(BaseModel):
    """LLM provider test request."""

    test_message: str = "Hello, this is a test message."


class LLMProviderTestResponse(BaseModel):
    """LLM provider test response."""

    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    latency_ms: Optional[float] = None
