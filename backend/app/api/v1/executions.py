"""
Executions API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from app.api.deps import get_db
from app.models import Execution
from app.schemas import ExecutionCreate, ExecutionResponse, MessageResponse
from app.services.crew_service import crew_service
from app.utils.logger import logger
from app.tasks.crew_tasks import execute_crew_task          # ← ADD THIS
from fastapi.responses import StreamingResponse             # ← ADD THIS
from app.services.export_service import export_service      # ← ADD THIS

router = APIRouter()


async def execute_crew_background(execution_id: UUID, db: Session):
    """Execute crew in background."""
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            return

        # Update status
        execution.status = "running"
        execution.started_at = datetime.utcnow()
        db.commit()

        # Build and execute crew
        crew = await crew_service.build_crew(
            db, execution.project_id, execution.input_data
        )
        result = await crew_service.execute_crew(crew, execution.input_data)

        # Update execution
        execution.status = "completed"
        execution.result = {"output": result["result"]}
        execution.completed_at = datetime.utcnow()
        db.commit()

        logger.info(f"Execution {execution_id} completed successfully")

    except Exception as e:
        logger.error(f"Execution {execution_id} failed: {str(e)}")

        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            db.commit()


@router.get("/", response_model=List[ExecutionResponse])
def list_executions(db: Session = Depends(get_db)):
    """List all executions."""
    executions = db.query(Execution).order_by(Execution.created_at.desc()).all()
    return executions


@router.post("/projects/{project_id}/execute", response_model=ExecutionResponse)
async def execute_project(
    project_id: UUID,
    execution_data: ExecutionCreate,
    db: Session = Depends(get_db),
):
    """Execute a project using Celery."""
    # Create execution record
    execution = Execution(
        project_id=project_id,
        input_data=execution_data.input_data,
        output_format=execution_data.output_format,
        status="pending",
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Execute in background using Celery
    execute_crew_task.delay(execution_id=str(execution.id))

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

    execution.status = "cancelled"
    execution.completed_at = datetime.utcnow()
    db.commit()

    return MessageResponse(message="Execution cancelled successfully")


@router.get("/executions/{execution_id}/export/excel")
async def export_execution_excel(execution_id: UUID, db: Session = Depends(get_db)):
    """Export execution to Excel."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    data = {
        "Execution ID": str(execution.id),
        "Status": execution.status,
        "Result": str(execution.result or {}),
        "Created At": str(execution.created_at),
        "Started At": str(execution.started_at or "Not started"),
        "Completed At": str(execution.completed_at or "Not completed"),
        "Tokens Used": execution.tokens_used or 0,
        "Estimated Cost": str(execution.estimated_cost or 0),
    }

    buffer = export_service.export_to_excel(data)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=execution_{execution_id}.xlsx"}
    )


@router.get("/executions/{execution_id}/export/word")
async def export_execution_word(execution_id: UUID, db: Session = Depends(get_db)):
    """Export execution to Word."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    data = {
        "Execution ID": str(execution.id),
        "Status": execution.status,
        "Result": execution.result or {},
        "Created At": str(execution.created_at),
        "Logs": execution.logs or "No logs available",
    }

    buffer = export_service.export_to_word(data)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=execution_{execution_id}.docx"}
    )


@router.get("/executions/{execution_id}/export/pdf")
async def export_execution_pdf(execution_id: UUID, db: Session = Depends(get_db)):
    """Export execution to PDF."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    data = {
        "Execution ID": str(execution.id),
        "Status": execution.status,
        "Result": str(execution.result or {}),
        "Created At": str(execution.created_at),
    }

    buffer = export_service.export_to_pdf(data)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=execution_{execution_id}.pdf"}
    )
