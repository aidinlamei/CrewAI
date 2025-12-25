"""
WebSocket manager for execution updates.
"""
from typing import Dict, List
from fastapi import WebSocket
import json
import asyncio
from app.utils.logger import logger


class ExecutionWebSocketManager:
    """Manager for execution WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, execution_id: str):
        """Connect a WebSocket for an execution."""
        await websocket.accept()
        
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        
        self.active_connections[execution_id].append(websocket)
        logger.info(f"WebSocket connected for execution {execution_id}")
    
    def disconnect(self, execution_id: str, websocket: WebSocket = None):
        """Disconnect a WebSocket."""
        if execution_id in self.active_connections:
            if websocket:
                if websocket in self.active_connections[execution_id]:
                    self.active_connections[execution_id].remove(websocket)
            
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
        
        logger.info(f"WebSocket disconnected for execution {execution_id}")
    
    async def send_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {str(e)}")
    
    async def broadcast_async(self, execution_id: str, message: dict):
        """Broadcast a message to all connections for an execution (async)."""
        if execution_id not in self.active_connections:
            return
        
        disconnected = []
        
        for websocket in self.active_connections[execution_id]:
            try:
                await self.send_message(websocket, message)
            except Exception as e:
                logger.error(f"WebSocket send failed: {str(e)}")
                disconnected.append(websocket)
        
        for websocket in disconnected:
            self.disconnect(execution_id, websocket)
    
    def broadcast(self, execution_id: str, message: dict):
        """Broadcast a message (sync wrapper for use in non-async contexts)."""
        if execution_id not in self.active_connections:
            return
        
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.broadcast_async(execution_id, message))
            else:
                loop.run_until_complete(self.broadcast_async(execution_id, message))
        except RuntimeError:
            # No event loop, create new one
            asyncio.run(self.broadcast_async(execution_id, message))


execution_manager = ExecutionWebSocketManager()
