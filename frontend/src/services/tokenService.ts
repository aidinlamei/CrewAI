import api from './api'

export interface DailyUsage {
  date: string
  tokens: number
  cost: number
}

export interface ModelUsage {
  model: string
  total_tokens: number
  total_cost: number
  executions: number
}

export interface TokenUsageData {
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  total_cost: number
  daily_usage: DailyUsage[]
  by_model: ModelUsage[]
}

export const tokenService = {
  async getUsage(dateRange: '7d' | '30d' | '90d' = '7d'): Promise<TokenUsageData> {
    const response = await api.get('/token-usage', {
      params: { range: dateRange },
    })
    return response.data
  },

  async getByExecution(executionId: string): Promise<TokenUsageData> {
    const response = await api.get(`/executions/${executionId}/token-usage`)
    return response.data
  },
}
