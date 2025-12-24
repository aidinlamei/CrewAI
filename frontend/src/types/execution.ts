export interface Execution {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_data?: Record<string, any>;
  output_format: string;
  result?: Record<string, any>;
  logs?: string;
  error_message?: string;
  tokens_used?: number;
  estimated_cost?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ExecutionCreate {
  project_id: string;
  input_data?: Record<string, any>;
  output_format?: string;
}
