import api from './api';

export const tokenService = {
  async getUsage() {
    const { data } = await api.get('/token-usage');
    return data;
  },

  async getUsageByProject(projectId: string) {
    const { data } = await api.get(`/projects/${projectId}/token-usage`);
    return data;
  },

  async getUsageByAgent(agentId: string) {
    const { data } = await api.get(`/agents/${agentId}/token-usage`);
    return data;
  },
};
