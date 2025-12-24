"""
Task schemas.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import BaseSchema


class TaskBase(BaseModel):
    """Base task schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    expected_output: Optional[str] = None
    agent_id: Optional[UUID] = None
    order_index: Optional[int] = None
    dependencies: Optional[List[str]] = []  # Task IDs
    tools: Optional[List[str]] = []  # Tool IDs
    context: Optional[Dict[str, Any]] = {}


class TaskCreate(TaskBase):
    """Task creation schema."""

    project_id: UUID


class TaskUpdate(BaseModel):
    """Task update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    expected_output: Optional[str] = None
    agent_id: Optional[UUID] = None
    order_index: Optional[int] = None
    dependencies: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    context: Optional[Dict[str, Any]] = None


class TaskResponse(TaskBase, BaseSchema):
    """Task response schema."""

    id: UUID
    project_id: UUID
    created_at: datetime


class TaskReorderRequest(BaseModel):
    """Task reorder request."""

    task_orders: List[Dict[str, Any]]  # [{"id": "uuid", "order_index": 0}, ...]
