"""
WebSocket manager for execution updates.
"""
from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio
from weakref import WeakSet
from app.utils.logger import logger


class ExecutionWebSocketManager:
    """Manager for execution WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self._pending_tasks: Set[asyncio.Task] = set()  # Track pending tasks
    
    async def connect(self, websocket: WebSocket, execution_id: str):
        """Connect a WebSocket for an execution."""
        await websocket.accept()
        
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        
        self.active_connections[execution_id].append(websocket)
        logger.info(f"WebSocket connected for execution {execution_id}. Total connections: {len(self.active_connections[execution_id])}")
    
    def disconnect(self, execution_id: str, websocket: WebSocket = None):
        """Disconnect a WebSocket."""
        if execution_id in self.active_connections:
            if websocket:
                if websocket in self.active_connections[execution_id]:
                    self.active_connections[execution_id].remove(websocket)
            
            # Clean up empty lists
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
        
        logger.info(f"WebSocket disconnected for execution {execution_id}")
    
    async def send_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {str(e)}")
            raise
    
    async def broadcast_async(self, execution_id: str, message: dict):
        """Broadcast a message to all connections for an execution (async)."""
        if execution_id not in self.active_connections:
            return
        
        disconnected = []
        
        # Copy the list to avoid modification during iteration
        connections = self.active_connections[execution_id].copy()
        
        for websocket in connections:
            try:
                await self.send_message(websocket, message)
            except Exception as e:
                logger.error(f"WebSocket send failed: {str(e)}")
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            self.disconnect(execution_id, websocket)
    
    def broadcast(self, execution_id: str, message: dict):
        """Broadcast a message (sync wrapper for use in non-async contexts)."""
        if execution_id not in self.active_connections:
            return
        
        def _task_done_callback(task: asyncio.Task):
            """Clean up completed tasks."""
            self._pending_tasks.discard(task)
            if task.exception():
                logger.error(f"Broadcast task failed: {task.exception()}")
        
        try:
            loop = asyncio.get_running_loop()
            # Create and track task to prevent memory leak
            task = loop.create_task(self.broadcast_async(execution_id, message))
            self._pending_tasks.add(task)
            task.add_done_callback(_task_done_callback)
        except RuntimeError:
            # No running event loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                loop.run_until_complete(self.broadcast_async(execution_id, message))
            except Exception as e:
                logger.error(f"Failed to broadcast message: {str(e)}")
    
    def get_connection_count(self, execution_id: str = None) -> int:
        """Get the number of active connections."""
        if execution_id:
            return len(self.active_connections.get(execution_id, []))
        return sum(len(conns) for conns in self.active_connections.values())
    
    async def cleanup(self):
        """Clean up all pending tasks and connections."""
        # Cancel all pending tasks
        for task in self._pending_tasks:
            task.cancel()
        
        # Wait for tasks to complete
        if self._pending_tasks:
            await asyncio.gather(*self._pending_tasks, return_exceptions=True)
        
        self._pending_tasks.clear()
        self.active_connections.clear()


execution_manager = ExecutionWebSocketManager()
