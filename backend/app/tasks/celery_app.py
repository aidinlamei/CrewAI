"""Celery application configuration."""
from celery import Celery
from app.config import settings

# Create Celery app
"""
Celery application configuration.
"""
from celery import Celery
from app.config import settings

celery_app = Celery(
    "crewai_manager",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Celery configuration
    include=["app.tasks.crew_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3000,  # 50 minutes
)
