"""
WebSocket manager for execution logs.
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json
from datetime import datetime
from app.utils.logger import logger


class ExecutionWebSocketManager:
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
