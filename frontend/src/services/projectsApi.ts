import { api } from './api';
import { Project, CreateProjectInput } from '../types';

export const projectsApi = {
  getAll: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return api.get<Project[]>(`/projects${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectInput) => api.post<Project>('/projects', data),
  update: (id: string, data: Partial<CreateProjectInput> & { autoDeploy?: boolean; webhookSecret?: string }) => api.put<Project>(`/projects/${id}`, data),
  regenerateWebhookSecret: (id: string) => api.post<{ webhookSecret: string }>(`/projects/${id}/webhook-secret/regenerate`, {}),
  delete: (id: string) => api.delete(`/projects/${id}`),
};
