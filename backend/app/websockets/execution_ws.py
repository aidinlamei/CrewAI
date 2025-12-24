"""
WebSocket handler for real-time execution logs.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, Set
from uuid import UUID
import asyncio
import json
from app.api.deps import get_db
from app.models import Execution
from app.utils.logger import logger

router = APIRouter()

# Store active connections per execution
class ConnectionManager:
    def __init__(self):
        # execution_id -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()
        self.active_connections[execution_id].add(websocket)
        logger.info(f"WebSocket connected for execution {execution_id}")

    def disconnect(self, websocket: WebSocket, execution_id: str):
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
        logger.info(f"WebSocket disconnected for execution {execution_id}")

    async def send_to_execution(self, execution_id: str, message: dict):
        """Send message to all connections for an execution."""
        if execution_id in self.active_connections:
            dead_connections = set()
            for websocket in self.active_connections[execution_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    dead_connections.add(websocket)
            
            # Clean up dead connections
            for ws in dead_connections:
                self.active_connections[execution_id].discard(ws)

    async def broadcast_log(self, execution_id: str, log: str):
        """Broadcast a log message."""
        await self.send_to_execution(execution_id, {
            "type": "log",
            "data": log,
        })

    async def broadcast_status(self, execution_id: str, status: str):
        """Broadcast status update."""
        await self.send_to_execution(execution_id, {
            "type": "status",
            "data": status,
        })

    async def broadcast_task_update(self, execution_id: str, task_id: str, status: str, output: str = None):
        """Broadcast task status update."""
        await self.send_to_execution(execution_id, {
            "type": "task_update",
            "data": {
                "task_id": task_id,
                "status": status,
                "output": output,
            },
        })

    async def broadcast_result(self, execution_id: str, result: dict):
        """Broadcast final result."""
        await self.send_to_execution(execution_id, {
            "type": "result",
            "data": result,
        })

    async def broadcast_error(self, execution_id: str, error: str):
        """Broadcast error message."""
        await self.send_to_execution(execution_id, {
            "type": "error",
            "data": error,
        })


# Global connection manager
manager = ConnectionManager()


def get_manager() -> ConnectionManager:
    """Get the connection manager instance."""
    return manager


@router.websocket("/ws/execution/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: str,
):
    """
    WebSocket endpoint for real-time execution updates.
    
    Events sent:
    - {"type": "log", "data": "log message"}
    - {"type": "status", "data": "running|completed|failed"}
    - {"type": "task_update", "data": {"task_id": "...", "status": "...", "output": "..."}}
    - {"type": "result", "data": {...}}
    - {"type": "error", "data": "error message"}
    """
    await manager.connect(websocket, execution_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "data": {"execution_id": execution_id},
        })
        
        # Keep connection alive and listen for client messages
        while True:
            try:
                # Wait for any message from client (ping/pong or commands)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0  # 30 second timeout
                )
                
                # Handle ping
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break
                    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        manager.disconnect(websocket, execution_id)
