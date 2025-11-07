import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Schools API
export const schoolsAPI = {
  getAll: () => api.get('/api/schools'),
  getById: (id) => api.get(`/api/schools/${id}`),
  create: (data) => api.post('/api/schools', data),
  update: (id, data) => api.put(`/api/schools/${id}`, data),
  delete: (id) => api.delete(`/api/schools/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/api/customers'),
  getById: (id) => api.get(`/api/customers/${id}`),
};

export default api;

