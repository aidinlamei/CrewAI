import api from './api';

export const memoryService = {
  async list(agentId: string, memoryType?: string, limit = 10) {
    const { data } = await api.get(`/agents/${agentId}/memory`, {
      params: { memory_type: memoryType, limit },
    });
    return data;
  },

  async create(agentId: string, memoryData: any) {
    const { data } = await api.post(`/agents/${agentId}/memory`, memoryData);
    return data;
  },

  async search(agentId: string, query: string, limit = 5) {
    const { data } = await api.post(`/agents/${agentId}/memory/search`, {
      query,
      limit,
    });
    return data;
  },

  async clear(agentId: string) {
    const { data } = await api.delete(`/agents/${agentId}/memory`);
    return data;
  },
};
