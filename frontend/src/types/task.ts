export interface Task {
  id: string
  project_id: string
  agent_id?: string
  name: string
  description: string
  expected_output?: string
  order_index?: number
  dependencies?: string[]
  tools?: string[]
  context?: Record<string, any>
  created_at: string
}

export interface TaskCreate {
  name: string
  description: string
  expected_output?: string
  agent_id?: string
  order_index?: number
  dependencies?: string[]
  tools?: string[]
  context?: Record<string, any>
}

export interface TaskUpdate extends Partial<TaskCreate> {}
