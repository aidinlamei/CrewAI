"""
Memory schemas.
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class MemoryEntryBase(BaseModel):
    """Base memory entry schema."""

    content: str
    memory_type: str = "short_term"
    metadata: Optional[Dict[str, Any]] = None


class MemoryEntryCreate(MemoryEntryBase):
    """Schema for creating a memory entry."""

    execution_id: Optional[UUID] = None


class MemoryEntryResponse(MemoryEntryBase):
    """Schema for memory entry response."""

    id: UUID
    agent_id: UUID
    execution_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class MemorySearchRequest(BaseModel):
    """Schema for memory search request."""

    query: str
    limit: int = 5
