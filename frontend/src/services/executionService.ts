import api from './api';
import { Execution, ExecutionCreate } from '@/types/execution';

export const executionService = {
  async list(): Promise<Execution[]> {
    const response = await api.get<Execution[]>('/executions');
    return response.data;
  },

  async get(id: string): Promise<Execution> {
    const response = await api.get<Execution>(`/executions/${id}`);
    return response.data;
  },

  async execute(projectId: string, data: ExecutionCreate): Promise<Execution> {
    const response = await api.post<Execution>(`/projects/${projectId}/execute`, data);
    return response.data;
  },

  async cancel(id: string): Promise<void> {
    await api.post(`/executions/${id}/cancel`);
  },
};
