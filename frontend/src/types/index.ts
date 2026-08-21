export interface User {
  _id: string;
  email: string;
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  _id: string;
  user: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: Pagination;
}

export interface AuthResponse {
  _id: string;
  email: string;
  token: string;
}
