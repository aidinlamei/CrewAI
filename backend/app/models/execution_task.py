"""
Execution Task model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class ExecutionTask(Base):
    """Execution Task model."""

    __tablename__ = "execution_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, running, completed, failed
    input = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    execution = relationship("Execution", back_populates="execution_tasks")
    task = relationship("Task", back_populates="execution_tasks")
    agent = relationship("Agent", back_populates="execution_tasks")

    def __repr__(self):
        return f"<ExecutionTask(id={self.id}, status='{self.status}')>"
