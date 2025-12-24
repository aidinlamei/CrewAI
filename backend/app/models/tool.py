"""
Tool model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Tool(Base):
    """Tool model."""

    __tablename__ = "tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    type = Column(String(50), nullable=False)  # 'built-in', 'langchain', 'custom'
    category = Column(String(100), nullable=True)  # 'search', 'file', 'web', 'code'
    description = Column(Text, nullable=True)
    python_code = Column(Text, nullable=True)  # For custom tools
    config = Column(JSONB, nullable=True, default={})  # Parameters, API keys, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Tool(id={self.id}, name='{self.name}', type='{self.type}')>"
