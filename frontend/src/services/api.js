import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffmed_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('staffmed_token');
      localStorage.removeItem('staffmed_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  completeOnboarding: (data) => api.post('/auth/complete-onboarding', data),
};

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  book: (data) => api.post('/appointments', data),
  cancel: (id, data) => api.patch(`/appointments/${id}/cancel`, data),
  complete: (id) => api.patch(`/appointments/${id}/complete`),
  followup: (id) => api.patch(`/appointments/${id}/followup`),
  verify: (id, data) => api.patch(`/appointments/${id}/verify`, data),
};

// ─── Physicians ──────────────────────────────────────────────────────────────
export const physiciansAPI = {
  getAll: (params) => api.get('/physicians', { params }),
  getById: (id) => api.get(`/physicians/${id}`),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getAll: (params) => api.get('/users', { params }),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  activate: (id) => api.patch(`/users/${id}/activate`),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};

// ─── Schedules ───────────────────────────────────────────────────────────────
export const schedulesAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  create: (data) => api.post('/schedules', data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// ─── System Health ────────────────────────────────────────────────────────────
export const healthAPI = {
  get: () => api.get('/health'),
};

export default api;
