import api from './api'

export interface Memory {
  id: string
  agent_id: string
  execution_id?: string
  memory_type: 'short_term' | 'long_term'
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface MemorySearchResponse {
  results: Memory[]
  total: number
}

export const memoryService = {
  async list(agentId: string, memoryType?: string): Promise<Memory[]> {
    const params = memoryType ? { memory_type: memoryType } : {}
    const response = await api.get(`/agents/${agentId}/memory`, { params })
    return response.data
  },

  async search(agentId: string, query: string, limit?: number): Promise<MemorySearchResponse> {
    const response = await api.post(
      `/agents/${agentId}/memory/search`,
      { query, limit }
    )
    return response.data
  },

  async clear(agentId: string, memoryType?: string): Promise<void> {
    const params = memoryType ? { memory_type: memoryType } : {}
    await api.delete(`/agents/${agentId}/memory`, { params })
  },
}
