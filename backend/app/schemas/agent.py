"""
Agent schemas.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import BaseSchema


class AgentBase(BaseModel):
    """Base agent schema."""

    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=500)
    goal: str = Field(..., min_length=1)
    backstory: Optional[str] = None
    llm_provider_id: Optional[UUID] = None
    llm_model: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    config: Optional[Dict[str, Any]] = {}


class AgentCreate(AgentBase):
    """Agent creation schema."""

    project_id: UUID


class AgentUpdate(BaseModel):
    """Agent update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[str] = Field(None, min_length=1, max_length=500)
    goal: Optional[str] = Field(None, min_length=1)
    backstory: Optional[str] = None
    llm_provider_id: Optional[UUID] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    config: Optional[Dict[str, Any]] = None


class AgentResponse(AgentBase, BaseSchema):
    """Agent response schema."""

    id: UUID
    project_id: UUID
    created_at: datetime
