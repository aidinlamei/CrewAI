"""WebSocket manager for execution logs."""
from typing import Dict, List
from fastapi import WebSocket
from uuid import UUID
import asyncio
"""
WebSocket manager for execution logs.
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json
from datetime import datetime
from app.utils.logger import logger


class ExecutionWebSocketManager:
    """Manager for execution WebSocket connections."""

    def __init__(self):
        """Initialize WebSocket manager."""
        # Store active connections: execution_id -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, execution_id: str, websocket: WebSocket):
        """Connect a WebSocket for an execution."""
        await websocket.accept()

        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []

        self.active_connections[execution_id].append(websocket)
        logger.info(f"WebSocket connected for execution {execution_id}")

    def disconnect(self, execution_id: str, websocket: WebSocket):
        """Disconnect a WebSocket."""
        if execution_id in self.active_connections:
            if websocket in self.active_connections[execution_id]:
                self.active_connections[execution_id].remove(websocket)

            # Clean up if no more connections
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

        logger.info(f"WebSocket disconnected for execution {execution_id}")

    async def send_message(self, execution_id: str, message: dict):
        """Send a message to all connected clients for an execution."""
        if execution_id in self.active_connections:
            # Create a copy of the list to avoid modification during iteration
            connections = self.active_connections[execution_id].copy()

            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to WebSocket: {e}")
                    # Remove failed connection
                    self.disconnect(execution_id, connection)

    async def send_log(self, execution_id: str, log: str, level: str = "info"):
        """Send a log message to all connected clients."""
        await self.send_message(
            execution_id,
            {
                "type": "log",
                "level": level,
                "message": log,
            }
        )

    async def send_status(self, execution_id: str, status: str):
        """Send a status update to all connected clients."""
        await self.send_message(
            execution_id,
            {
                "type": "status",
                "status": status,
            }
        )

    async def send_result(self, execution_id: str, result: dict):
        """Send execution result to all connected clients."""
        await self.send_message(
            execution_id,
            {
                "type": "result",
                "result": result,
            }
        )

    async def send_error(self, execution_id: str, error: str):
        """Send an error message to all connected clients."""
        await self.send_message(
            execution_id,
            {
                "type": "error",
                "message": error,
            }
        )
    """Manage WebSocket connections for execution logs."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, execution_id: str, websocket: WebSocket):
        """Accept and store WebSocket connection."""
        await websocket.accept()
        self.active_connections[execution_id] = websocket
        logger.info(f"WebSocket connected for execution {execution_id}")

    def disconnect(self, execution_id: str):
        """Remove WebSocket connection."""
        if execution_id in self.active_connections:
            del self.active_connections[execution_id]
            logger.info(f"WebSocket disconnected for execution {execution_id}")

    async def send_log(self, execution_id: str, log_type: str, message: str):
        """Send log message to client."""
        if execution_id in self.active_connections:
            try:
                await self.active_connections[execution_id].send_json({
                    "type": log_type,  # 'log', 'status', 'task_start', 'task_complete', 'result', 'error'
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to send WebSocket message: {str(e)}")
                self.disconnect(execution_id)

    async def send_status(self, execution_id: str, status: str, data: dict = None):
        """Send status update to client."""
        await self.send_log(execution_id, "status", json.dumps({
            "status": status,
            "data": data or {}
        }))

    async def send_task_update(self, execution_id: str, task_name: str, status: str):
        """Send task status update."""
        await self.send_log(execution_id, "task_update", json.dumps({
            "task": task_name,
            "status": status
        }))

    async def send_result(self, execution_id: str, result: dict):
        """Send final result to client."""
        await self.send_log(execution_id, "result", json.dumps(result))

    async def send_error(self, execution_id: str, error: str):
        """Send error to client."""
        await self.send_log(execution_id, "error", error)


# Singleton instance
ws_manager = ExecutionWebSocketManager()
