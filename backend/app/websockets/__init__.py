"""WebSocket package."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps import get_db
from app.websockets.execution_ws import execution_manager
from app.utils.logger import logger

# WebSocket router
execution_ws_router = APIRouter()


@execution_ws_router.websocket("/ws/executions/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: UUID,
):
    """WebSocket endpoint for real-time execution updates."""
    await execution_manager.connect(websocket, str(execution_id))
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Echo back (can be used for ping/pong)
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        execution_manager.disconnect(str(execution_id), websocket)
        logger.info(f"WebSocket disconnected for execution {execution_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        execution_manager.disconnect(str(execution_id), websocket)


__all__ = ["execution_manager", "execution_ws_router"]
