import api from './api';
import { Task, TaskCreate, TaskUpdate } from '@/types/task';

export const taskService = {
  async list(projectId: string): Promise<Task[]> {
    const response = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  },

  async get(id: string): Promise<Task> {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async create(projectId: string, data: TaskCreate): Promise<Task> {
    const response = await api.post<Task>(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  async update(id: string, data: TaskUpdate): Promise<Task> {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
import api from './api'
import type { Task, TaskCreate, TaskUpdate } from '@/types/task'

export const taskService = {
  // List tasks for a project
  async list(projectId: string): Promise<Task[]> {
    const response = await api.get(`/projects/${projectId}/tasks`)
    return response.data
  },

  // Get single task
  async get(taskId: string): Promise<Task> {
    const response = await api.get(`/tasks/${taskId}`)
    return response.data
  },

  // Create task
  async create(projectId: string, data: TaskCreate): Promise<Task> {
    const response = await api.post(`/projects/${projectId}/tasks`, data)
    return response.data
  },

  // Update task
  async update(taskId: string, data: TaskUpdate): Promise<Task> {
    const response = await api.put(`/tasks/${taskId}`, data)
    return response.data
  },

  // Delete task
  async delete(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`)
  },

  // Reorder tasks
  async reorder(projectId: string, taskIds: string[]): Promise<void> {
    await api.put('/tasks/reorder', { project_id: projectId, task_ids: taskIds })
  },
}
