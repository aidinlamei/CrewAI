"""
Celery tasks for crew execution.
"""
from celery import Task
from datetime import datetime
from uuid import UUID
import asyncio
from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models import Execution
from app.utils.logger import logger


class ExecutionTask(Task):
    """Base task for execution with error handling."""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        execution_id = kwargs.get('execution_id') or (args[0] if args else None)
        if execution_id:
            db = SessionLocal()
            try:
                execution = db.query(Execution).filter(
                    Execution.id == execution_id
                ).first()
                
                if execution:
                    execution.status = "failed"
                    execution.error_message = str(exc)
                    execution.completed_at = datetime.utcnow()
                    db.commit()
            except Exception as e:
                logger.error(f"Failed to update execution on failure: {e}")
            finally:
                db.close()


@celery_app.task(base=ExecutionTask, bind=True, name="execute_crew_task")
def execute_crew_task(self, execution_id: str):
    """
    Execute a crew in background using Celery.
    
    Args:
        execution_id: UUID of the execution
    """
    db = SessionLocal()
    
    try:
        execution = db.query(Execution).filter(
            Execution.id == execution_id
        ).first()
        
        if not execution:
            logger.error(f"Execution {execution_id} not found")
            return {"error": "Execution not found"}
        
        execution.status = "running"
        execution.started_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Starting execution {execution_id}")
        
        # Import here to avoid circular imports
        from app.services.crew_service import crew_service
        
        # Build crew
        crew = crew_service.build_crew(
            db=db,
            project_id=execution.project_id,
            input_data=execution.input_data,
        )
        
        # Execute crew
        result = crew_service.execute_crew(
            crew=crew,
            input_data=execution.input_data,
        )
        
        # Update execution with results
        execution.status = "completed"
        execution.result = {"output": result.get("result", str(result))}
        execution.completed_at = datetime.utcnow()
        
        # Update token usage if available
        if result.get("tokens_used"):
            execution.tokens_used = result["tokens_used"]
        if result.get("estimated_cost"):
            execution.estimated_cost = result["estimated_cost"]
            
        db.commit()
        
        logger.info(f"Execution {execution_id} completed successfully")
        return {"status": "completed", "result": execution.result}
        
    except Exception as e:
        logger.error(f"Execution {execution_id} failed: {str(e)}")
        
        execution = db.query(Execution).filter(
            Execution.id == execution_id
        ).first()
        
        if execution:
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            db.commit()
        
        raise
        
    finally:
        db.close()


@celery_app.task(name="cancel_execution_task")
def cancel_execution_task(execution_id: str):
    """Cancel a running execution."""
    db = SessionLocal()
    try:
        execution = db.query(Execution).filter(
            Execution.id == execution_id
        ).first()
        
        if execution and execution.status in ["pending", "running"]:
            execution.status = "cancelled"
            execution.completed_at = datetime.utcnow()
            db.commit()
            logger.info(f"Execution {execution_id} cancelled")
            return {"status": "cancelled"}
        
        return {"status": "not_found_or_completed"}
    finally:
        db.close()
