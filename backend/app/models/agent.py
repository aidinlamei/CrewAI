"""
Agent model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Agent(Base):
    """Agent model."""

    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(500), nullable=False)
    goal = Column(Text, nullable=False)
    backstory = Column(Text, nullable=True)
    llm_provider_id = Column(UUID(as_uuid=True), ForeignKey("llm_providers.id"), nullable=True, index=True)
    llm_model = Column(String(100), nullable=True)
    temperature = Column(Numeric(3, 2), default=0.7)
    max_tokens = Column(Integer, nullable=True)
    config = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="agents")
    llm_provider = relationship("LLMProvider", back_populates="agents")
    tasks = relationship("Task", back_populates="agent")
    execution_tasks = relationship("ExecutionTask", back_populates="agent")
    memory_entries = relationship("MemoryEntry", back_populates="agent", cascade="all, delete-orphan")
    token_usage = relationship("TokenUsage", back_populates="agent")

    def __repr__(self):
        return f"<Agent(id={self.id}, name='{self.name}', role='{self.role}')>"
