export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  agents_count?: number
  tasks_count?: number
  executions_count?: number
}

export interface ProjectCreate {
  name: string
  description?: string
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

export interface ProjectDetail extends Project {
  agents_count: number
  tasks_count: number
  executions_count: number
}
