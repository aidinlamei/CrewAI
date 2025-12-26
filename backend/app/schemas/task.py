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

    name: str = Field(..., min_length=1, max_length=255, description="Task name")
    description: str = Field(..., min_length=1, max_length=5000, description="Task description")
    expected_output: Optional[str] = Field(None, max_length=2000, description="Expected output")
    agent_id: Optional[UUID] = Field(None, description="Agent ID assigned to task")
    order_index: Optional[int] = Field(None, ge=0, description="Task execution order")
    dependencies: Optional[List[str]] = Field(default_factory=list, description="Dependent task IDs")
    tools: Optional[List[str]] = Field(default_factory=list, description="Tool IDs to use")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Task context")


class TaskCreate(TaskBase):
    """Task creation schema."""

    project_id: UUID


class TaskUpdate(BaseModel):
    """Task update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    expected_output: Optional[str] = Field(None, max_length=2000)
    agent_id: Optional[UUID] = None
    order_index: Optional[int] = Field(None, ge=0)
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
