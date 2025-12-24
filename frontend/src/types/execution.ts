export interface Execution {
  id: string
  project_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input_data?: Record<string, any>
  output_format?: string
  result?: any
  logs?: string
  error_message?: string
  tokens_used?: number
  estimated_cost?: number | string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ExecutionCreate {
  input_data?: Record<string, any>
  output_format?: string
}

export interface ExecutionTask {
  id: string
  execution_id: string
  task_id: string
  agent_id?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: string
  output?: string
  tokens_used?: number
  started_at?: string
  completed_at?: string
}
