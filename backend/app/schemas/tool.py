"""
Tool schemas.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import BaseSchema


class ToolBase(BaseModel):
    """Base tool schema."""

    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., regex="^(built-in|langchain|custom)$")
    category: Optional[str] = None
    description: Optional[str] = None
    python_code: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}
    is_active: bool = True


class ToolCreate(ToolBase):
    """Tool creation schema."""

    pass


class ToolUpdate(BaseModel):
    """Tool update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, regex="^(built-in|langchain|custom)$")
    category: Optional[str] = None
    description: Optional[str] = None
    python_code: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ToolResponse(ToolBase, BaseSchema):
    """Tool response schema."""

    id: UUID
    created_at: datetime


class ToolTestRequest(BaseModel):
    """Tool test request."""

    parameters: Dict[str, Any] = {}


class ToolTestResponse(BaseModel):
    """Tool test response."""

    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
