"""
Memory API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.api.deps import get_db
from app.models import MemoryEntry
from app.schemas import (
    MemoryEntryCreate,
    MemoryEntryResponse,
    MemorySearchRequest,
    MessageResponse,
)
from app.services.mem0_service import mem0_service

router = APIRouter()


@router.get("/agents/{agent_id}/memory", response_model=List[MemoryEntryResponse])
def get_agent_memories(
    agent_id: UUID,
    memory_type: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get memories for an agent."""
    memories = mem0_service.get_memories(db, str(agent_id), memory_type, limit)
    return memories


@router.post("/agents/{agent_id}/memory", response_model=MemoryEntryResponse)
def create_memory(
    agent_id: UUID,
    memory_data: MemoryEntryCreate,
    db: Session = Depends(get_db),
):
    """Create a memory entry for an agent."""
    memory = mem0_service.add_memory(
        db=db,
        agent_id=str(agent_id),
        execution_id=str(memory_data.execution_id)
        if memory_data.execution_id
        else None,
        content=memory_data.content,
        memory_type=memory_data.memory_type,
        metadata=memory_data.metadata,
    )
    return memory


@router.post("/agents/{agent_id}/memory/search")
def search_memories(
    agent_id: UUID, request: MemorySearchRequest, db: Session = Depends(get_db)
):
    """Search agent memories."""
    results = mem0_service.search_memories(
        str(agent_id), request.query, request.limit
    )
    return {"results": results}


@router.delete("/agents/{agent_id}/memory", response_model=MessageResponse)
def clear_memories(agent_id: UUID, db: Session = Depends(get_db)):
    """Clear all memories for an agent."""
    mem0_service.clear_memories(db, str(agent_id))
    return MessageResponse(message="Memories cleared successfully")
