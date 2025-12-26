"""
WebSocket manager for execution logs.
"""
from fastapi import WebSocket
from typing import Dict, List
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


# Singleton instance
ws_manager = ExecutionWebSocketManager()
