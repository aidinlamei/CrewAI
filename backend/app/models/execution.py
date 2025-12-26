"""
Execution model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Execution(Base):
    """Execution model."""

    __tablename__ = "executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True)  # pending, running, completed, failed, cancelled
    input_data = Column(JSONB, nullable=True, default={})
    output_format = Column(String(50), nullable=True, default="json")  # json, markdown, excel
    result = Column(JSONB, nullable=True)
    logs = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    estimated_cost = Column(Numeric(10, 4), nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    project = relationship("Project", back_populates="executions")
    execution_tasks = relationship("ExecutionTask", back_populates="execution", cascade="all, delete-orphan")
    token_usage = relationship("TokenUsage", back_populates="execution")
    memory_entries = relationship("MemoryEntry", back_populates="execution")

    def __repr__(self):
        return f"<Execution(id={self.id}, status='{self.status}')>"
