"""
Token Usage model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class TokenUsage(Base):
    """Token Usage model."""

    __tablename__ = "token_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("executions.id"), nullable=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    llm_provider_id = Column(UUID(as_uuid=True), ForeignKey("llm_providers.id"), nullable=True)
    model = Column(String(100), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    estimated_cost = Column(Numeric(10, 4), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    execution = relationship("Execution", back_populates="token_usage")
    agent = relationship("Agent", back_populates="token_usage")
    llm_provider = relationship("LLMProvider", back_populates="token_usage")

    def __repr__(self):
        return f"<TokenUsage(id={self.id}, total_tokens={self.total_tokens})>"
