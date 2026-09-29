import { api } from './api';
import { User } from '../types';

export const userApi = {
  getUser: () => api.get<User>('/user'),
};
