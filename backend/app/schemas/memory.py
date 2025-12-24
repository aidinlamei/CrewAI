"""Memory schemas."""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.schemas.common import BaseSchema


class MemoryEntryBase(BaseModel):
    """Base memory entry schema."""
    content: str
    memory_type: str = "short_term"
    metadata: Optional[Dict[str, Any]] = {}


class MemoryEntryResponse(MemoryEntryBase, BaseSchema):
    """Memory entry response schema."""
    id: UUID
    agent_id: UUID
    execution_id: Optional[UUID] = None
    created_at: datetime


class MemorySearchRequest(BaseModel):
    """Memory search request."""
    query: str
    limit: int = 5


class MemorySearchResponse(BaseModel):
    """Memory search response."""
    results: List[Dict[str, Any]]
