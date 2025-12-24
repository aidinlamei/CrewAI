"""
Project Template model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class ProjectTemplate(Base):
    """Project Template model."""

    __tablename__ = "project_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # 'research', 'content', 'analysis'
    template_data = Column(JSONB, nullable=False)  # Complete project structure
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ProjectTemplate(id={self.id}, name='{self.name}')>"
