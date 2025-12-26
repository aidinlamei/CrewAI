"""
Execution schemas.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal
from app.schemas.common import BaseSchema


class ExecutionCreate(BaseModel):
    """Execution creation schema."""

    project_id: UUID
    input_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Input data for execution")
    output_format: str = Field(default="json", pattern="^(json|markdown|excel|word|pdf|html)$", description="Output format")


class ExecutionUpdate(BaseModel):
    """Execution update schema."""

    status: Optional[str] = Field(None, pattern="^(pending|running|completed|failed|cancelled)$")
    result: Optional[Dict[str, Any]] = None
    logs: Optional[str] = Field(None, max_length=1000000)  # 1MB max for logs
    error_message: Optional[str] = Field(None, max_length=10000)
    tokens_used: Optional[int] = Field(None, ge=0)
    estimated_cost: Optional[Decimal] = Field(None, ge=0)


class ExecutionResponse(BaseSchema):
    """Execution response schema."""

    id: UUID
    project_id: UUID
    status: str
    input_data: Dict[str, Any]
    output_format: str
    result: Optional[Dict[str, Any]]
    logs: Optional[str]
    error_message: Optional[str]
    tokens_used: Optional[int]
    estimated_cost: Optional[Decimal]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


class ExecutionDetailResponse(ExecutionResponse):
    """Execution detail response with tasks."""

    tasks: list = []


class ExecutionLogResponse(BaseModel):
    """Execution log response."""

    logs: str
    status: str
