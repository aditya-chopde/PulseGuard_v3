import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 60000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulseguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling global errors like expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and potentially redirect to login
      localStorage.removeItem('pulseguard_token');
      localStorage.removeItem('pulseguard_user');
      // If we want to hard redirect: window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
