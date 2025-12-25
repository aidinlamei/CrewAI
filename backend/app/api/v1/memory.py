"""
Memory API endpoints for Mem0 integration.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.api.deps import get_db
from app.models import MemoryEntry
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime

router = APIRouter()


class MemoryEntryResponse(BaseModel):
    id: UUID
    agent_id: UUID
    execution_id: Optional[UUID]
    memory_type: str
    content: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: Optional[int] = Field(default=10, ge=1, le=100)
    memory_type: Optional[str] = None


class MemorySearchResponse(BaseModel):
    results: List[MemoryEntryResponse]
    total: int


@router.get("/agents/{agent_id}/memory", response_model=List[MemoryEntryResponse])
async def get_agent_memory(
    agent_id: UUID,
    memory_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get memory entries for an agent."""
    query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == agent_id)
    
    if memory_type:
        query = query.filter(MemoryEntry.memory_type == memory_type)
    
    memories = query.order_by(MemoryEntry.created_at.desc()).limit(limit).all()
    return memories


@router.post("/agents/{agent_id}/memory/search", response_model=MemorySearchResponse)
async def search_agent_memory(
    agent_id: UUID,
    request: MemorySearchRequest,
    db: Session = Depends(get_db),
):
    """Search agent memory."""
    from sqlalchemy import func
    
    # Sanitize search query - escape special SQL characters
    search_query = request.query.replace("%", r"\%").replace("_", r"\_")
    search_pattern = f"%{search_query}%"
    
    # Use parameterized query to prevent SQL injection
    query = db.query(MemoryEntry).filter(
        MemoryEntry.agent_id == agent_id,
        func.lower(MemoryEntry.content).like(func.lower(search_pattern))
    )
    
    if request.memory_type:
        query = query.filter(MemoryEntry.memory_type == request.memory_type)
    
    results = query.limit(request.limit or 10).all()
    return MemorySearchResponse(results=results, total=len(results))


@router.delete("/agents/{agent_id}/memory")
async def clear_agent_memory(
    agent_id: UUID,
    memory_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Clear agent memory."""
    query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == agent_id)
    
    if memory_type:
        query = query.filter(MemoryEntry.memory_type == memory_type)
    
    query.delete()
    db.commit()
    
    return {"message": "Memory cleared successfully", "success": True}
