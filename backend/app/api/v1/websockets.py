"""
WebSocket endpoints for real-time communication.
"""
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db
from app.models import Execution
from app.websockets.execution_ws import ws_manager
from app.utils.logger import logger
from app.utils.auth import decode_access_token
from app.services.auth_service import auth_service

router = APIRouter()


@router.websocket("/ws/execution/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: str,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time execution logs.

    Clients connect to this endpoint to receive real-time updates
    about execution progress, logs, and results.

    Authentication is via token query parameter.
    Example: ws://host/api/v1/ws/execution/{id}?token={jwt_token}
    """
    try:
        # Authenticate user via token
        if token:
            payload = decode_access_token(token)
            if payload is None:
                await websocket.close(code=4001, reason="Invalid authentication token")
                return

            user_id = payload.get("sub")
            if not user_id:
                await websocket.close(code=4001, reason="Invalid token payload")
                return

            user = auth_service.get_user_by_id(db, user_id)
            if not user or not user.is_active:
                await websocket.close(code=4003, reason="User not found or inactive")
                return

            logger.info(f"WebSocket authenticated for user {user.email}")

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
