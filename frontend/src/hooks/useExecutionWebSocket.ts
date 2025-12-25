import { useEffect, useState, useRef } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const TOKEN_KEY = 'crewai_token'

interface WebSocketMessage {
  type: 'status_update' | 'log' | 'error' | 'result'
  status?: string
  message?: string
  error?: string
  result?: any
}

interface UseExecutionWebSocketOptions {
  executionId: string
  enabled?: boolean
  onLog?: (log: string) => void
  onStatusChange?: (status: string) => void
  onResult?: (result: any) => void
  onError?: (error: string) => void
}

export function useExecutionWebSocket(options: UseExecutionWebSocketOptions | string) {
  // Handle both object and string argument
  const config: UseExecutionWebSocketOptions = typeof options === 'string' 
    ? { executionId: options }
    : options

  const { executionId, enabled = true, onLog, onStatusChange, onResult, onError } = config

  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Refs for callbacks to avoid stale closures
  const onLogRef = useRef(onLog)
  const onStatusChangeRef = useRef(onStatusChange)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onLogRef.current = onLog
    onStatusChangeRef.current = onStatusChange
    onResultRef.current = onResult
    onErrorRef.current = onError
  }, [onLog, onStatusChange, onResult, onError])

  useEffect(() => {
    if (!executionId || !enabled) return

    const connect = () => {
      try {
        // Include auth token in WebSocket connection
        const token = localStorage.getItem(TOKEN_KEY)
        const wsUrl = token 
          ? `${WS_URL}/api/v1/ws/executions/${executionId}?token=${token}`
          : `${WS_URL}/api/v1/ws/executions/${executionId}`
        
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket connected for execution:', executionId)
          setIsConnected(true)
          setError(null)
        }

        ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data)

            switch (data.type) {
              case 'status_update':
                if (data.status) {
                  setStatus(data.status)
                  onStatusChangeRef.current?.(data.status)
                }
                break

              case 'log':
                if (data.message) {
                  setLogs((prev) => [...prev, data.message!])
                  onLogRef.current?.(data.message)
                }
                break

              case 'result':
                if (data.result) {
                  onResultRef.current?.(data.result)
                }
                break

              case 'error':
                if (data.error) {
                  setError(data.error)
                  onErrorRef.current?.(data.error)
                }
                break
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setError('WebSocket connection error')
          setIsConnected(false)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          // Attempt to reconnect after 3 seconds if enabled
          if (enabled) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...')
              connect()
            }, 3000)
          }
        }
      } catch (err) {
        console.error('Failed to create WebSocket:', err)
        setError('Failed to establish WebSocket connection')
        setIsConnected(false)
      }
    }

    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [executionId, enabled])

  return { isConnected, status, logs, error }
}
