import { useEffect, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

interface LogMessage {
  type: string;
  message: string;
  timestamp: string;
  level?: string;
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
          setLogs((prev) => [
            ...prev,
            {
              type: data.level || 'info',
              message: data.message,
              timestamp: new Date().toISOString(),
            },
          ]);
          break;
        case 'status':
          // Backend sends: { type: "status", status: "running" }
          setStatus(data.status);
          break;
        case 'task_update':
          // Backend sends: { type: "task_update", task: "...", status: "..." }
          setLogs((prev) => [
            ...prev,
            {
              type: 'task',
              message: `Task "${data.task}" - ${data.status}`,
              timestamp: new Date().toISOString(),
            },
          ]);
          break;
        case 'result':
          // Backend sends: { type: "result", result: {...} }
          setResult(data.result);
          break;
        case 'error':
          // Backend sends: { type: "error", message: "..." }
          setError(data.message);
          break;
        case 'heartbeat':
          // Heartbeat - do nothing
          break;
        default:
          console.warn('Unknown WebSocket message type:', data.type);
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
