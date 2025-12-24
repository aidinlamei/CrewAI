/**
 * WebSocket service for real-time execution updates.
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export type WebSocketEventType = 
  | 'connected'
  | 'log'
  | 'status'
  | 'task_update'
  | 'result'
  | 'error'
  | 'ping'
  | 'pong'

export interface WebSocketMessage {
  type: WebSocketEventType
  data: any
}

export interface TaskUpdateData {
  task_id: string
  status: string
  output?: string
}

type MessageHandler = (message: WebSocketMessage) => void
type ConnectionHandler = () => void

export class ExecutionWebSocket {
  private ws: WebSocket | null = null
  private executionId: string
  private messageHandlers: MessageHandler[] = []
  private connectHandler: ConnectionHandler | null = null
  private disconnectHandler: ConnectionHandler | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: number | null = null

  constructor(executionId: string) {
    this.executionId = executionId
  }

  /**
   * Connect to the WebSocket server.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_URL}/api/v1/ws/execution/${this.executionId}`
      
      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log(`WebSocket connected for execution ${this.executionId}`)
          this.reconnectAttempts = 0
          this.startPing()
          this.connectHandler?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            
            // Handle ping/pong internally
            if (message.type === 'ping') {
              this.send('pong')
              return
            }
            
            // Notify all handlers
            this.messageHandlers.forEach(handler => handler(message))
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`)
          this.stopPing()
          this.disconnectHandler?.()
          
          // Attempt reconnect if not intentional close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.stopPing()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  /**
   * Send a message to the server.
   */
  send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    }
  }

  /**
   * Register a message handler.
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  /**
   * Register a connection handler.
   */
  onConnect(handler: ConnectionHandler): void {
    this.connectHandler = handler
  }

  /**
   * Register a disconnect handler.
   */
  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandler = handler
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      this.send('ping')
    }, 25000) // Send ping every 25 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

/**
 * Create a WebSocket connection for an execution.
 */
export function createExecutionWebSocket(executionId: string): ExecutionWebSocket {
  return new ExecutionWebSocket(executionId)
}
