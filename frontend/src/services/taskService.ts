import api from './api';
import type { ApiResponse, Task, TaskListResponse } from '../types';

export const getTasks = async (params: any = {}): Promise<TaskListResponse> => {
  const { data } = await api.get<ApiResponse<TaskListResponse>>('/api/tasks', { params });
  return data.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const { data } = await api.get<ApiResponse<Task>>(`/api/tasks/${id}`);
  return data.data;
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  const { data } = await api.post<ApiResponse<Task>>('/api/tasks', taskData);
  return data.data;
};

export const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
  const { data } = await api.put<ApiResponse<Task>>(`/api/tasks/${id}`, taskData);
  return data.data;
};

export const updateTaskStatus = async (id: string, status: string): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<Task>>(`/api/tasks/${id}/status`, { status });
  return data.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/api/tasks/${id}`);
};
