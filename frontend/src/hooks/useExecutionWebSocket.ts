import { useEffect, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

interface LogMessage {
  type: string;
  message: string;
  timestamp: string;
}

export function useExecutionWebSocket(executionId: string | null) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!executionId) return;

    const ws = new WebSocket(`${WS_URL}/api/v1/ws/execution/${executionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'log':
          setLogs((prev) => [...prev, data]);
          break;
        case 'status':
          const statusData = JSON.parse(data.message);
          setStatus(statusData.status);
          break;
        case 'task_update':
          const taskData = JSON.parse(data.message);
          setLogs((prev) => [
            ...prev,
            {
              type: 'task',
              message: `Task "${taskData.task}" - ${taskData.status}`,
              timestamp: data.timestamp,
            },
          ]);
          break;
        case 'result':
          setResult(JSON.parse(data.message));
          break;
        case 'error':
          setError(data.message);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [executionId]);

  return { logs, status, result, error, isConnected };
}
