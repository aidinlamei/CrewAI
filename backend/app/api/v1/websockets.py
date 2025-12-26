"""
WebSocket endpoints for real-time communication.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db
from app.models import Execution
from app.websockets.execution_ws import ws_manager
from app.utils.logger import logger

router = APIRouter()


@router.websocket("/ws/execution/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: str,
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time execution logs.

    Clients connect to this endpoint to receive real-time updates
    about execution progress, logs, and results.
    """
    try:
        # Verify execution exists
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            await websocket.close(code=4004, reason="Execution not found")
            return

        # Connect WebSocket
        await ws_manager.connect(execution_id, websocket)

        # Send initial status
        await ws_manager.send_status(execution_id, execution.status)

        # Keep connection alive and listen for messages
        try:
            while True:
                # Wait for any message from client (ping/pong)
                data = await websocket.receive_text()

                # Echo back for ping/pong
                if data == "ping":
                    await websocket.send_text("pong")

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for execution {execution_id}")

    except Exception as e:
        logger.error(f"WebSocket error for execution {execution_id}: {e}")

    finally:
        # Disconnect WebSocket
        ws_manager.disconnect(execution_id, websocket)
