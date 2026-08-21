import api from './api';
import type { ApiResponse, AuthResponse, User } from '../types';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password });
  return data.data;
};

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', { email, password });
  return data.data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>('/api/auth/me');
  return data.data;
};
