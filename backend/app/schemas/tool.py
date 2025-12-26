"""
Tool schemas.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import BaseSchema


class ToolBase(BaseModel):
    """Base tool schema."""

    name: str = Field(..., min_length=1, max_length=255, description="Tool name")
    type: str = Field(..., pattern="^(built-in|langchain|custom)$", description="Tool type")
    category: Optional[str] = Field(None, max_length=100, description="Tool category")
    description: Optional[str] = Field(None, max_length=2000, description="Tool description")
    python_code: Optional[str] = Field(None, max_length=50000, description="Python code for custom tools")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Tool configuration")
    is_active: bool = Field(default=True, description="Whether tool is active")

    @field_validator('python_code')
    @classmethod
    def validate_python_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate Python code is not just whitespace."""
        if v is not None and v.strip() == "":
            raise ValueError("Python code cannot be empty or only whitespace")
        return v


class ToolCreate(ToolBase):
    """Tool creation schema."""

    pass


class ToolUpdate(BaseModel):
    """Tool update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, pattern="^(built-in|langchain|custom)$")
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    python_code: Optional[str] = Field(None, max_length=50000)
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
