import api from './api'
import type { Execution, ExecutionCreate } from '@/types/execution'

export const executionService = {
  // List all executions
  async list(): Promise<Execution[]> {
    const response = await api.get('/executions')
    return response.data
  },

  // Get single execution
  async get(executionId: string): Promise<Execution> {
    const response = await api.get(`/executions/${executionId}`)
    return response.data
  },

  // Execute a project
  async execute(projectId: string, data: ExecutionCreate): Promise<Execution> {
    const response = await api.post(`/projects/${projectId}/execute`, data)
    return response.data
  },

  // Cancel execution
  async cancel(executionId: string): Promise<void> {
    await api.post(`/executions/${executionId}/cancel`)
  },

  // Get execution logs
  async getLogs(executionId: string): Promise<string> {
    const response = await api.get(`/executions/${executionId}/logs`)
    return response.data
  },
}
