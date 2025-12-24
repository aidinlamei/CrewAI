"""
Project schemas.
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import BaseSchema


class ProjectBase(BaseModel):
    """Base project schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Project creation schema."""

    pass


class ProjectUpdate(BaseModel):
    """Project update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectResponse(ProjectBase, BaseSchema):
    """Project response schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime


class ProjectDetailResponse(ProjectResponse):
    """Project detail response with counts."""

    agents_count: int = 0
    tasks_count: int = 0
    executions_count: int = 0


class ProjectExportResponse(BaseModel):
    """Project export schema."""

    project: dict
    agents: list
    tasks: list
