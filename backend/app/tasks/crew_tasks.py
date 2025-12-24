"""
Celery tasks for CrewAI execution.
"""
import asyncio
from datetime import datetime
from uuid import UUID
from celery import current_task
from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models import Execution, ExecutionTask, Task, Agent
from app.services.crew_service import crew_service
from app.utils.logger import logger


class ExecutionLogger:
    """Logger that captures logs for an execution."""
    
    def __init__(self, execution_id: str):
        self.execution_id = execution_id
        self.logs = []
    
    def log(self, message: str):
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.logs.append(log_entry)
        logger.info(f"[Execution {self.execution_id}] {message}")
    
    def get_logs(self) -> str:
        return "\n".join(self.logs)


@celery_app.task(bind=True, name="execute_crew")
def execute_crew_task(self, execution_id: str):
    """
    Execute a CrewAI crew in the background.
    
    Args:
        execution_id: UUID of the execution record
    """
    db = SessionLocal()
    exec_logger = ExecutionLogger(execution_id)
    
    try:
        # Get execution
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            logger.error(f"Execution {execution_id} not found")
            return {"status": "error", "message": "Execution not found"}
        
        exec_logger.log("Starting execution...")
        
        # Update status to running
        execution.status = "running"
        execution.started_at = datetime.utcnow()
        db.commit()
        
        # Update task state
        self.update_state(state="RUNNING", meta={"status": "running"})
        
        exec_logger.log(f"Building crew for project {execution.project_id}")
        
        # Get tasks for this project
        tasks = (
            db.query(Task)
            .filter(Task.project_id == execution.project_id)
            .order_by(Task.order_index)
            .all()
        )
        
        # Create execution task records
        for task in tasks:
            exec_task = ExecutionTask(
                execution_id=execution.id,
                task_id=task.id,
                agent_id=task.agent_id,
                status="pending",
            )
            db.add(exec_task)
        db.commit()
        
        exec_logger.log(f"Created {len(tasks)} execution tasks")
        
        # Build and execute crew
        try:
            # Run async crew building
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            crew = loop.run_until_complete(
                crew_service.build_crew(db, execution.project_id, execution.input_data)
            )
            
            exec_logger.log("Crew built successfully, starting execution...")
            
            # Execute crew
            result = loop.run_until_complete(
                crew_service.execute_crew(crew, execution.input_data)
            )
            
            loop.close()
            
            exec_logger.log("Crew execution completed")
            
            # Update execution with result
            execution.status = "completed"
            execution.result = {"output": result.get("result", "")}
            execution.completed_at = datetime.utcnow()
            execution.logs = exec_logger.get_logs()
            
            # Update all execution tasks to completed
            db.query(ExecutionTask).filter(
                ExecutionTask.execution_id == execution.id
            ).update({"status": "completed", "completed_at": datetime.utcnow()})
            
            db.commit()
            
            exec_logger.log("Execution completed successfully")
            
            return {
                "status": "completed",
                "result": result,
            }
            
        except Exception as e:
            exec_logger.log(f"Execution failed: {str(e)}")
            raise
        
    except Exception as e:
        logger.error(f"Crew execution failed: {str(e)}")
        
        # Update execution with error
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            execution.logs = exec_logger.get_logs()
            db.commit()
        
        return {
            "status": "failed",
            "error": str(e),
        }
        
    finally:
        db.close()


@celery_app.task(name="cancel_execution")
def cancel_execution_task(execution_id: str):
    """
    Cancel a running execution.
    
    Args:
        execution_id: UUID of the execution to cancel
    """
    db = SessionLocal()
    
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution and execution.status == "running":
            execution.status = "cancelled"
            execution.completed_at = datetime.utcnow()
            db.commit()
            logger.info(f"Execution {execution_id} cancelled")
            return {"status": "cancelled"}
        return {"status": "not_running"}
    finally:
        db.close()
