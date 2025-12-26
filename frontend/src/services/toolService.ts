import api from './api'
import type { Tool, ToolCreate, ToolUpdate } from '@/types/tool'

export const toolService = {
  // List all tools
  async list(params?: { category?: string; type?: string }): Promise<Tool[]> {
    const response = await api.get('/tools', { params })
    return response.data
  },

  // Get tool categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/tools/categories')
    return response.data
  },

  // Get single tool
  async get(toolId: string): Promise<Tool> {
    const response = await api.get(`/tools/${toolId}`)
    return response.data
  },

  // Create tool
  async create(data: ToolCreate): Promise<Tool> {
    const response = await api.post('/tools', data)
    return response.data
  },

  // Update tool
  async update(toolId: string, data: ToolUpdate): Promise<Tool> {
    const response = await api.put(`/tools/${toolId}`, data)
    return response.data
  },

  // Delete tool
  async delete(toolId: string): Promise<void> {
    await api.delete(`/tools/${toolId}`)
  },

  // Test tool
  async test(toolId: string, parameters: Record<string, any>): Promise<{ success: boolean; result?: any; error?: string }> {
    const response = await api.post(`/tools/${toolId}/test`, { parameters })
    return response.data
  },
}
