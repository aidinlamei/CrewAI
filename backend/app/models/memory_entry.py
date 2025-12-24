"""
Memory Entry model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class MemoryEntry(Base):
    """Memory Entry model."""

    __tablename__ = "memory_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("executions.id"), nullable=True)
    memory_type = Column(String(50), nullable=False, default="short_term")  # short_term, long_term
    content = Column(Text, nullable=False)
    metadata = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    agent = relationship("Agent", back_populates="memory_entries")
    execution = relationship("Execution", back_populates="memory_entries")

    def __repr__(self):
        return f"<MemoryEntry(id={self.id}, memory_type='{self.memory_type}')>"
