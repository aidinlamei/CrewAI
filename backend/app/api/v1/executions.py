"""
Executions API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from app.api.deps import get_db
from app.models import Execution, Project
from app.schemas import ExecutionCreate, ExecutionResponse, MessageResponse
from app.utils.logger import logger

router = APIRouter()


@router.get("/executions", response_model=List[ExecutionResponse])
def list_executions(
    project_id: UUID = None,
    status: str = None,
    db: Session = Depends(get_db),
):
    """List all executions with optional filters."""
    query = db.query(Execution).order_by(Execution.created_at.desc())
    
    if project_id:
        query = query.filter(Execution.project_id == project_id)
    if status:
        query = query.filter(Execution.status == status)
    
    return query.all()


@router.post("/projects/{project_id}/execute", response_model=ExecutionResponse)
async def execute_project(
    project_id: UUID,
    execution_data: ExecutionCreate,
    db: Session = Depends(get_db),
):
    """
    Execute a project.
    
    This creates an execution record and starts the crew in the background.
    Use WebSocket to receive real-time updates.
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create execution record
    execution = Execution(
        project_id=project_id,
        input_data=execution_data.input_data or {},
        output_format=execution_data.output_format or "json",
        status="pending",
    )
    
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    logger.info(f"Created execution {execution.id} for project {project_id}")
    
    # Try to use Celery, fall back to sync execution
    try:
        from app.tasks.crew_tasks import execute_crew_task
        
        # Start Celery task
        execute_crew_task.delay(str(execution.id))
        logger.info(f"Started Celery task for execution {execution.id}")
        
    except Exception as e:
        logger.warning(f"Celery not available, running sync: {str(e)}")
        
        # Fall back to synchronous execution
        from app.services.crew_service import crew_service
        import asyncio
        
        try:
            execution.status = "running"
            execution.started_at = datetime.utcnow()
            db.commit()
            
            # Build and execute crew
            crew = await crew_service.build_crew(db, project_id, execution.input_data)
            result = await crew_service.execute_crew(crew, execution.input_data)
            
            # Update execution
            execution.status = "completed"
            execution.result = {"output": result.get("result", "")}
            execution.completed_at = datetime.utcnow()
            db.commit()
            
        except Exception as exec_error:
            execution.status = "failed"
            execution.error_message = str(exec_error)
            execution.completed_at = datetime.utcnow()
            db.commit()
            logger.error(f"Execution {execution.id} failed: {str(exec_error)}")
    
    db.refresh(execution)
    return execution


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
def get_execution(execution_id: UUID, db: Session = Depends(get_db)):
    """Get execution by ID."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.post("/executions/{execution_id}/cancel", response_model=MessageResponse)
def cancel_execution(execution_id: UUID, db: Session = Depends(get_db)):
    """Cancel an execution."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    if execution.status in ["completed", "failed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Execution already finished")

    # Try to cancel Celery task
    try:
        from app.tasks.crew_tasks import cancel_execution_task
        cancel_execution_task.delay(str(execution_id))
    except Exception:
        pass
    
    execution.status = "cancelled"
    execution.completed_at = datetime.utcnow()
    db.commit()

    return MessageResponse(message="Execution cancelled successfully")


@router.get("/executions/{execution_id}/logs")
def get_execution_logs(execution_id: UUID, db: Session = Depends(get_db)):
    """Get execution logs."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return {
        "execution_id": str(execution_id),
        "logs": execution.logs or "",
        "status": execution.status,
    }
