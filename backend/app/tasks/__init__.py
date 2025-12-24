"""Tasks package."""
from app.tasks.celery_app import celery_app
from app.tasks.crew_tasks import execute_crew_task

__all__ = ['celery_app', 'execute_crew_task']
