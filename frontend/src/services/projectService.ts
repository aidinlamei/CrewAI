import api from './api';
import { Project, ProjectCreate, ProjectUpdate, ProjectDetail } from '@/types/project';

export const projectService = {
  async list(): Promise<Project[]> {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  async get(id: string): Promise<ProjectDetail> {
    const response = await api.get<ProjectDetail>(`/projects/${id}`);
    return response.data;
  },

  async create(data: ProjectCreate): Promise<Project> {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
