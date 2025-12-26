"""Celery tasks for crew execution."""
from celery import Task
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
"""
Celery tasks for crew execution.
"""
import asyncio
from celery import Task
from sqlalchemy.orm import Session
from datetime import datetime
from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models import Execution
from app.services.crew_service import crew_service
from app.utils.logger import logger
import asyncio
from app.websockets.execution_ws import ws_manager
from app.utils.logger import logger


class ExecutionTask(Task):
    """Base task for crew execution."""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        execution_id = kwargs.get('execution_id')
        if execution_id:
            db = SessionLocal()
            try:
                execution = db.query(Execution).filter(Execution.id == execution_id).first()
        execution_id = kwargs.get("execution_id")
        if execution_id:
            db = SessionLocal()
            try:
                execution = (
                    db.query(Execution)
                    .filter(Execution.id == execution_id)
                    .first()
                )
                if execution:
                    execution.status = "failed"
                    execution.error_message = str(exc)
                    execution.completed_at = datetime.utcnow()
                    db.commit()

                    # Send error via WebSocket
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(
                        ws_manager.send_error(str(execution_id), str(exc))
                    )
                    loop.close()
            finally:
                db.close()


@celery_app.task(base=ExecutionTask, bind=True)
def execute_crew_task(self, execution_id: str):
    """
    Execute a crew in background.

    Args:
        execution_id: Execution ID
    """
    db = SessionLocal()

    try:
        # Get execution
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        execution = (
            db.query(Execution).filter(Execution.id == execution_id).first()
        )
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        # Update status
        execution.status = "running"
        execution.started_at = datetime.utcnow()
        db.commit()

        logger.info(f"Executing crew for execution {execution_id}")

        # Build and execute crew
        # crew_service methods are async, so we need to run them in an event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            crew = loop.run_until_complete(
                crew_service.build_crew(db, execution.project_id, execution.input_data)
            )
            result = loop.run_until_complete(
                crew_service.execute_crew(crew, execution.input_data)
            )
        finally:
            loop.close()

        # Update execution with result
        execution.status = "completed"
        execution.result = {"output": result["result"]}
        execution.completed_at = datetime.utcnow()
        db.commit()

        # Send status via WebSocket
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(
            ws_manager.send_status(execution_id, "running")
        )
        loop.run_until_complete(
            ws_manager.send_log(execution_id, "log", "Building crew...")
        )

        # Build crew
        logger.info(f"Building crew for execution {execution_id}")

        crew = loop.run_until_complete(
            crew_service.build_crew(
                db, str(execution.project_id), execution.input_data or {}
            )
        )

        # Execute crew
        logger.info(f"Executing crew for execution {execution_id}")
        loop.run_until_complete(
            ws_manager.send_log(execution_id, "log", "Executing crew...")
        )

        result = loop.run_until_complete(
            crew_service.execute_crew(crew, execution.input_data or {})
        )

        # Update execution with result
        execution.status = "completed"
        execution.result = {"output": result.get("result", "")}
        execution.completed_at = datetime.utcnow()
        db.commit()

        # Send result via WebSocket
        loop.run_until_complete(
            ws_manager.send_result(execution_id, execution.result)
        )
        loop.run_until_complete(
            ws_manager.send_status(execution_id, "completed")
        )
        loop.close()

        logger.info(f"Execution {execution_id} completed successfully")

        return {"status": "completed", "execution_id": execution_id}

    except Exception as e:
        logger.error(f"Execution {execution_id} failed: {str(e)}")

        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        execution = (
            db.query(Execution).filter(Execution.id == execution_id).first()
        )
        if execution:
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            db.commit()

        raise

    finally:
        db.close()
