"""
Task model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Task(Base):
    """Task model."""

    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=True)
    dependencies = Column(JSONB, nullable=True, default=[])  # Array of task IDs
    tools = Column(JSONB, nullable=True, default=[])  # Array of tool IDs
    context = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    agent = relationship("Agent", back_populates="tasks")
    execution_tasks = relationship("ExecutionTask", back_populates="task")

    def __repr__(self):
        return f"<Task(id={self.id}, name='{self.name}')>"
