import { api } from './api';
import { Activity } from '../types';

export const activityApi = {
  getAll: () => api.get<Activity[]>('/activity'),
};
