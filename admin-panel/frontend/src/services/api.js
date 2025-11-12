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

// Grades API
export const gradesAPI = {
  getAll: (schoolId) => {
    const params = schoolId ? { schoolId } : {};
    return api.get('/api/grades', { params });
  },
  getById: (id) => api.get(`/api/grades/${id}`),
  create: (data) => api.post('/api/grades', data),
  update: (id, data) => api.put(`/api/grades/${id}`, data),
  delete: (id) => api.delete(`/api/grades/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: (schoolId) => {
    const params = schoolId ? { schoolId } : {};
    return api.get('/api/categories', { params });
  },
  getById: (id) => api.get(`/api/categories/${id}`),
  create: (data) => api.post('/api/categories', data),
  update: (id, data) => api.put(`/api/categories/${id}`, data),
  delete: (id) => api.delete(`/api/categories/${id}`),
};

// Books API
export const booksAPI = {
  getAll: () => api.get('/api/books'),
  getById: (id) => api.get(`/api/books/${id}`),
  create: (data) => api.post('/api/books', data),
  update: (id, data) => api.put(`/api/books/${id}`, data),
  delete: (id) => api.delete(`/api/books/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;

