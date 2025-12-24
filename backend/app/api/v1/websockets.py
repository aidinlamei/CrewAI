"""
WebSocket endpoints for real-time communication.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.execution_ws import ws_manager

router = APIRouter()


@router.websocket("/ws/execution/{execution_id}")
async def execution_websocket(websocket: WebSocket, execution_id: str):
    """WebSocket endpoint for execution logs."""
    await ws_manager.connect(execution_id, websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_json({"type": "heartbeat", "message": "alive"})
    except WebSocketDisconnect:
        ws_manager.disconnect(execution_id)
