"""WebSocket package."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from uuid import UUID
from typing import Optional
from app.websockets.execution_ws import execution_manager
from app.core.security import verify_token
from app.utils.logger import logger

# WebSocket router
execution_ws_router = APIRouter()


@execution_ws_router.websocket("/ws/executions/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: UUID,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time execution updates.
    
    Requires authentication token as query parameter:
    ws://localhost:8000/api/v1/ws/executions/{id}?token=your_jwt_token
    """
    # Verify authentication
    if token:
        try:
            payload = verify_token(token)
            user_id = payload.get("sub")
            if not user_id:
                await websocket.close(code=1008, reason="Invalid token")
                return
        except Exception as e:
            logger.warning(f"WebSocket auth failed: {str(e)}")
            await websocket.close(code=1008, reason="Authentication failed")
            return
    else:
        # Allow unauthenticated connections in development
        # In production, uncomment the following:
        # await websocket.close(code=1008, reason="Token required")
        # return
        logger.warning(f"WebSocket connection without token for execution {execution_id}")
    
    await execution_manager.connect(websocket, str(execution_id))
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle ping/pong for keep-alive
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        execution_manager.disconnect(str(execution_id), websocket)
        logger.info(f"WebSocket disconnected for execution {execution_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        execution_manager.disconnect(str(execution_id), websocket)


__all__ = ["execution_manager", "execution_ws_router"]
