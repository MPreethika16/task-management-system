import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// We handle 401 unauthenticated errors in the API interceptor
// This provides a central place to clear the token and force logout.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a 401 Unauthorized, it might be an invalid token
    if (error.response?.status === 401) {
      // Don't intercept 401s from login/register endpoints to avoid infinite loops or clearing states unnecessarily
      const url = error.config.url;
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        // Dispatch a custom event to notify AuthContext to update its state
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
