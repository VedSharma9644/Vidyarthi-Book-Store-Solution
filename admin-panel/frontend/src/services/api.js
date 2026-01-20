import axios from 'axios';
import authService from './auth';

// Use production backend URL by default, or environment variable if set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://admin-panel-backend-594708558503.us-central1.run.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to all requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authService.logout();
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  uploadImage: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.folderPath) formData.append('folderPath', metadata.folderPath);
    if (metadata.uploadedBy) formData.append('uploadedBy', metadata.uploadedBy);
    return api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAllImages: (category, limit) => {
    const params = {};
    if (category) params.category = category;
    if (limit) params.limit = limit;
    return api.get('/api/upload/images', { params });
  },
  getImageById: (id) => api.get(`/api/upload/images/${id}`),
  deleteImage: (id) => api.delete(`/api/upload/images/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/api/orders'),
  getById: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, data) => api.put(`/api/orders/${id}/status`, data),
  createShiprocketOrder: (id) => api.post(`/api/orders/${id}/shiprocket`),
  getShiprocketStatus: (id) => api.get(`/api/orders/${id}/shiprocket-status`),
};

// Email API
export const emailAPI = {
  getConfig: () => api.get('/api/email/config'),
  saveConfig: (data) => api.post('/api/email/config', data),
  testConfig: (testEmail) => api.post('/api/email/test', { testEmail }),
  requestPasswordReset: () => api.post('/api/email/request-reset'),
  resetPassword: (otp, newPassword) => api.post('/api/email/reset-password', { otp, newPassword }),
};

export default api;

