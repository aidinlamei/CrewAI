import api from './api';
import { Agent, AgentCreate, AgentUpdate } from '@/types/agent';

export const agentService = {
  async list(projectId: string): Promise<Agent[]> {
    const response = await api.get<Agent[]>(`/projects/${projectId}/agents`);
    return response.data;
  },

  async get(id: string): Promise<Agent> {
    const response = await api.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  async create(projectId: string, data: AgentCreate): Promise<Agent> {
    const response = await api.post<Agent>(`/projects/${projectId}/agents`, data);
    return response.data;
  },

  async update(id: string, data: AgentUpdate): Promise<Agent> {
    const response = await api.put<Agent>(`/agents/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/agents/${id}`);
  },
};
