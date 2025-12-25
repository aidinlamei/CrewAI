"""
Mem0 service for managing agent memory.
"""
from typing import List, Dict, Any, Optional
try:
    from mem0 import Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False
    Memory = None

from sqlalchemy.orm import Session
from app.models import MemoryEntry, Agent
from app.utils.logger import logger


class Mem0Service:
    """Service for managing agent memory using Mem0."""

    def __init__(self):
        """Initialize Mem0 Memory."""
        self.memory = None
        if MEM0_AVAILABLE:
            try:
                self.memory = Memory()
                logger.info("Mem0 Memory initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Mem0: {str(e)}")
        else:
            logger.warning("Mem0 not available - memory features will be limited")

    def add_memory(
        self,
        db: Session,
        agent_id: str,
        execution_id: Optional[str],
        content: str,
        memory_type: str = "short_term",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryEntry:
        """
        Add memory for an agent.

        Args:
            db: Database session
            agent_id: Agent ID
            execution_id: Execution ID (optional)
            content: Memory content
            memory_type: 'short_term' or 'long_term'
            metadata: Additional metadata

        Returns:
            Created memory entry
        """
        try:
            # Store in Mem0 if available
            if self.memory:
                self.memory.add(
                    content, user_id=str(agent_id), metadata=metadata or {}
                )

            # Store in database
            memory_entry = MemoryEntry(
                agent_id=agent_id,
                execution_id=execution_id,
                memory_type=memory_type,
                content=content,
                metadata=metadata or {},
            )

            db.add(memory_entry)
            db.commit()
            db.refresh(memory_entry)

            logger.info(f"Added memory for agent {agent_id}")
            return memory_entry

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add memory: {str(e)}")
            raise

    def get_memories(
        self,
        db: Session,
        agent_id: str,
        memory_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[MemoryEntry]:
        """
        Get memories for an agent.

        Args:
            db: Database session
            agent_id: Agent ID
            memory_type: Filter by memory type (optional)
            limit: Maximum number of memories to return

        Returns:
            List of memory entries
        """
        query = db.query(MemoryEntry).filter(MemoryEntry.agent_id == agent_id)

        if memory_type:
            query = query.filter(MemoryEntry.memory_type == memory_type)

        return query.order_by(MemoryEntry.created_at.desc()).limit(limit).all()

    def search_memories(
        self, agent_id: str, query: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search memories using Mem0.

        Args:
            agent_id: Agent ID
            query: Search query
            limit: Maximum results

        Returns:
            List of matching memories
        """
        try:
            if not self.memory:
                logger.warning("Mem0 not available for search")
                return []

            results = self.memory.search(
                query, user_id=str(agent_id), limit=limit
            )

            return results

        except Exception as e:
            logger.error(f"Memory search failed: {str(e)}")
            return []

    def clear_memories(self, db: Session, agent_id: str):
        """
        Clear all memories for an agent.

        Args:
            db: Database session
            agent_id: Agent ID
        """
        try:
            # Clear from Mem0 if available
            if self.memory:
                try:
                    self.memory.delete_all(user_id=str(agent_id))
                except Exception as e:
                    logger.warning(f"Failed to clear Mem0 memories: {str(e)}")

            # Clear from database
            db.query(MemoryEntry).filter(
                MemoryEntry.agent_id == agent_id
            ).delete()
            db.commit()

            logger.info(f"Cleared all memories for agent {agent_id}")

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to clear memories: {str(e)}")
            raise

    def get_relevant_context(
        self, agent_id: str, current_task: str, limit: int = 3
    ) -> str:
        """
        Get relevant context from memory for current task.

        Args:
            agent_id: Agent ID
            current_task: Current task description
            limit: Number of relevant memories

        Returns:
            Formatted context string
        """
        try:
            memories = self.search_memories(agent_id, current_task, limit)

            if not memories:
                return ""

            context = "Relevant past experiences:\n"
            for i, memory in enumerate(memories, 1):
                context += f"{i}. {memory.get('text', '')}\n"

            return context

        except Exception as e:
            logger.error(f"Failed to get context: {str(e)}")
            return ""


# Singleton instance
mem0_service = Mem0Service()
