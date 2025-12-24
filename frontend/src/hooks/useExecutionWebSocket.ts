import { useState, useEffect, useCallback, useRef } from 'react'
import { ExecutionWebSocket, createExecutionWebSocket, WebSocketMessage } from '@/services/websocket'

interface UseExecutionWebSocketOptions {
  executionId: string
  enabled?: boolean
  onLog?: (log: string) => void
  onStatusChange?: (status: string) => void
  onTaskUpdate?: (taskId: string, status: string, output?: string) => void
  onResult?: (result: any) => void
  onError?: (error: string) => void
}

interface UseExecutionWebSocketReturn {
  isConnected: boolean
  logs: string[]
  connect: () => void
  disconnect: () => void
}

export function useExecutionWebSocket({
  executionId,
  enabled = true,
  onLog,
  onStatusChange,
  onTaskUpdate,
  onResult,
  onError,
}: UseExecutionWebSocketOptions): UseExecutionWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const wsRef = useRef<ExecutionWebSocket | null>(null)

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connected:', message.data)
        break
        
      case 'log':
        setLogs(prev => [...prev, message.data])
        onLog?.(message.data)
        break
        
      case 'status':
        onStatusChange?.(message.data)
        break
        
      case 'task_update':
        onTaskUpdate?.(
          message.data.task_id,
          message.data.status,
          message.data.output
        )
        break
        
      case 'result':
        onResult?.(message.data)
        break
        
      case 'error':
        onError?.(message.data)
        break
        
      default:
        console.log('Unknown message type:', message.type)
    }
  }, [onLog, onStatusChange, onTaskUpdate, onResult, onError])

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect()
    }

    const ws = createExecutionWebSocket(executionId)
    wsRef.current = ws

    ws.onConnect(() => setIsConnected(true))
    ws.onDisconnect(() => setIsConnected(false))
    ws.onMessage(handleMessage)

    ws.connect().catch(err => {
      console.error('Failed to connect WebSocket:', err)
    })
  }, [executionId, handleMessage])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && executionId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, executionId, connect, disconnect])

  return {
    isConnected,
    logs,
    connect,
    disconnect,
  }
}
