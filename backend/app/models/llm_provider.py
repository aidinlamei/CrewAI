"""
LLM Provider model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class LLMProvider(Base):
    """LLM Provider model."""

    __tablename__ = "llm_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # 'openai', 'anthropic', 'google', 'ollama'
    display_name = Column(String(100), nullable=True)
    api_key_encrypted = Column(Text, nullable=True)  # Encrypted with Fernet
    api_base_url = Column(String(500), nullable=True)  # For custom endpoints
    available_models = Column(JSONB, nullable=True, default=[])  # Array of model names
    default_model = Column(String(100), nullable=True)
    config = Column(JSONB, nullable=True, default={})  # Extra configuration
    is_active = Column(Boolean, default=True)
    last_tested_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    agents = relationship("Agent", back_populates="llm_provider")
    token_usage = relationship("TokenUsage", back_populates="llm_provider")

    def __repr__(self):
        return f"<LLMProvider(id={self.id}, name='{self.name}')>"
