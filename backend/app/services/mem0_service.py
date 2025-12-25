"""
Mem0 memory integration service.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
from app.models import MemoryEntry
from app.utils.logger import logger


class Mem0Service:
    """Service for Mem0 memory management."""
    
    def __init__(self):
        """Initialize Mem0 client."""
        self.memory = None
        try:
            from mem0 import Memory
            
            config = {
                "vector_store": {
                    "provider": "chroma",
                    "config": {
                        "collection_name": "crewai_memories",
                        "path": "./chroma_db",
                    }
                }
            }
            self.memory = Memory.from_config(config)
            logger.info("Mem0 service initialized successfully")
        except ImportError:
            logger.warning("Mem0 not installed, using database-only storage")
        except Exception as e:
            logger.warning(f"Failed to initialize Mem0: {str(e)}, using database-only storage")
    
    async def add_memory(
        self,
        db: Session,
        agent_id: str,
        content: str,
        memory_type: str = "short_term",
        execution_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryEntry:
        """Add a memory entry."""
        try:
            if self.memory:
                self.memory.add(
                    content,
                    user_id=agent_id,
                    metadata={
                        "memory_type": memory_type,
                        "execution_id": execution_id,
                        **(metadata or {}),
                    }
                )
            
            memory_entry = MemoryEntry(
                agent_id=UUID(agent_id),
                execution_id=UUID(execution_id) if execution_id else None,
                memory_type=memory_type,
                content=content,
                metadata=metadata or {},
            )
            
            db.add(memory_entry)
            db.commit()
            db.refresh(memory_entry)
            
            logger.info(f"Memory added for agent {agent_id}")
            return memory_entry
            
        except Exception as e:
            logger.error(f"Failed to add memory: {str(e)}")
            db.rollback()
            raise
    
    async def get_agent_memories(
        self,
        db: Session,
        agent_id: str,
        memory_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[MemoryEntry]:
        """Get memory entries for an agent."""
        query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == UUID(agent_id))
        
        if memory_type:
            query = query.filter(MemoryEntry.memory_type == memory_type)
        
        memories = query.order_by(MemoryEntry.created_at.desc()).limit(limit).all()
        return memories
    
    async def search_memories(
        self,
        db: Session,
        agent_id: str,
        query: str,
        limit: int = 10,
    ) -> List[MemoryEntry]:
        """Search memories."""
        try:
            if self.memory:
                results = self.memory.search(query, user_id=agent_id, limit=limit)
                memory_ids = [r.get("id") for r in results if r.get("id")]
                if memory_ids:
                    memories = (
                        db.query(MemoryEntry)
                        .filter(MemoryEntry.id.in_(memory_ids))
                        .all()
                    )
                    return memories
            
            # Fallback to simple text search
            memories = (
                db.query(MemoryEntry)
                .filter(
                    MemoryEntry.agent_id == UUID(agent_id),
                    MemoryEntry.content.ilike(f"%{query}%")
                )
                .limit(limit)
                .all()
            )
            return memories
            
        except Exception as e:
            logger.error(f"Memory search failed: {str(e)}")
            return []
    
    def get_relevant_context(
        self,
        agent_id: str,
        goal: str,
        limit: int = 3,
    ) -> str:
        """Get relevant memory context for an agent's goal."""
        try:
            if not self.memory:
                return ""
            
            results = self.memory.search(goal, user_id=agent_id, limit=limit)
            
            if not results:
                return ""
            
            context_parts = []
            for i, result in enumerate(results, 1):
                content = result.get("memory", "")
                if content:
                    context_parts.append(f"{i}. {content}")
            
            if context_parts:
                return "Relevant past experiences:\n" + "\n".join(context_parts)
            
            return ""
            
        except Exception as e:
            logger.error(f"Failed to get relevant context: {str(e)}")
            return ""
    
    async def clear_agent_memory(
        self,
        db: Session,
        agent_id: str,
        memory_type: Optional[str] = None,
    ):
        """Clear agent memory."""
        try:
            query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == UUID(agent_id))
            
            if memory_type:
                query = query.filter(MemoryEntry.memory_type == memory_type)
            
            query.delete()
            db.commit()
            
            if self.memory:
                self.memory.delete_all(user_id=agent_id)
            
            logger.info(f"Memory cleared for agent {agent_id}")
            
        except Exception as e:
            logger.error(f"Failed to clear memory: {str(e)}")
            db.rollback()
            raise


mem0_service = Mem0Service()
