"""Memory API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import MemoryEntry, Agent
from app.schemas.memory import (
    MemoryEntryResponse,
    MemoryEntryBase,
    MemorySearchRequest,
    MemorySearchResponse,
)
from app.utils.logger import logger
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
async def get_agent_memory(
    agent_id: UUID,
    memory_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get memory entries for an agent."""
    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == agent_id)

    if memory_type:
        query = query.filter(MemoryEntry.memory_type == memory_type)

    memories = query.order_by(MemoryEntry.created_at.desc()).limit(limit).all()

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
async def create_memory_entry(
    agent_id: UUID,
    memory: MemoryEntryBase,
    execution_id: UUID = None,
    db: Session = Depends(get_db),
):
    """Create a memory entry for an agent."""
    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    memory_entry = MemoryEntry(
        agent_id=agent_id,
        execution_id=execution_id,
        memory_type=memory.memory_type,
        content=memory.content,
        metadata=memory.metadata or {},
    )

    db.add(memory_entry)
    db.commit()
    db.refresh(memory_entry)

    logger.info(f"Created memory entry for agent {agent_id}")

    return memory_entry


@router.post("/agents/{agent_id}/memory/search", response_model=MemorySearchResponse)
async def search_memory(
    agent_id: UUID,
    search_request: MemorySearchRequest,
    db: Session = Depends(get_db),
):
    """Search memory entries for an agent."""
    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Simple text search (can be enhanced with vector search using mem0ai)
    query = db.query(MemoryEntry).filter(
        MemoryEntry.agent_id == agent_id,
        MemoryEntry.content.ilike(f"%{search_request.query}%")
    )

    memories = query.order_by(MemoryEntry.created_at.desc()).limit(search_request.limit).all()

    results = [
        {
            "id": str(memory.id),
            "content": memory.content,
            "memory_type": memory.memory_type,
            "created_at": memory.created_at.isoformat(),
            "metadata": memory.metadata,
        }
        for memory in memories
    ]

    return MemorySearchResponse(results=results)


@router.delete("/memory/{memory_id}")
async def delete_memory_entry(
    memory_id: UUID,
    db: Session = Depends(get_db),
):
    """Delete a memory entry."""
    memory = db.query(MemoryEntry).filter(MemoryEntry.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory entry not found")

    db.delete(memory)
    db.commit()

    logger.info(f"Deleted memory entry {memory_id}")

    return {"message": "Memory entry deleted successfully"}


@router.delete("/agents/{agent_id}/memory")
async def clear_agent_memory(
    agent_id: UUID,
    memory_type: str = None,
    db: Session = Depends(get_db),
):
    """Clear memory entries for an agent."""
    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == agent_id)

    if memory_type:
        query = query.filter(MemoryEntry.memory_type == memory_type)

    count = query.delete()
    db.commit()

    logger.info(f"Cleared {count} memory entries for agent {agent_id}")

    return {"message": f"Cleared {count} memory entries"}
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
