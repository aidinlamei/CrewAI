import api from './api'
import type { LLMProvider, LLMProviderCreate, LLMProviderUpdate } from '@/types/llm'

export const llmService = {
  // List all providers
  async list(): Promise<LLMProvider[]> {
    const response = await api.get('/llm-providers')
    return response.data
  },

  // Get single provider
  async get(providerId: string): Promise<LLMProvider> {
    const response = await api.get(`/llm-providers/${providerId}`)
    return response.data
  },

  // Create provider
  async create(data: LLMProviderCreate): Promise<LLMProvider> {
    const response = await api.post('/llm-providers', data)
    return response.data
  },

  // Update provider
  async update(providerId: string, data: LLMProviderUpdate): Promise<LLMProvider> {
    const response = await api.put(`/llm-providers/${providerId}`, data)
    return response.data
  },

  // Delete provider
  async delete(providerId: string): Promise<void> {
    await api.delete(`/llm-providers/${providerId}`)
  },

  // Test connection
  async test(providerId: string, testMessage?: string): Promise<{ success: boolean; response?: string; latency_ms?: number; error?: string }> {
    const response = await api.post(`/llm-providers/${providerId}/test`, {
      test_message: testMessage || 'Hello, this is a test message.',
    })
    return response.data
  },
}
