import { api } from './api';
import { Deployment } from '../types';

export const deploymentsApi = {
  getAll: (projectId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (status) params.set('status', status);
    const qs = params.toString();
    return api.get<Deployment[]>(`/deployments${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => api.get<Deployment>(`/deployments/${id}`),
  getByProjectId: (projectId: string) => api.get<Deployment[]>(`/projects/${projectId}/deployments`),
  getLogsByProjectId: (projectId: string) => api.get<{ logs: string }>(`/projects/${projectId}/logs`),
  create: (projectId: string) => api.post<Deployment>('/deployments', { projectId }),
};
