import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt refresh for login or refresh endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/refresh');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Client API
export const clientApi = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getTypes: () => api.get('/clients/types'),
  createType: (name: string) => api.post('/clients/types', { name }),
};

// Engineer API
export const engineerApi = {
  getAll: (params?: any) => api.get('/engineers', { params }),
  getById: (id: string) => api.get(`/engineers/${id}`),
  create: (data: any) => api.post('/engineers', data),
  update: (id: string, data: any) => api.put(`/engineers/${id}`, data),
  delete: (id: string) => api.delete(`/engineers/${id}`),
};

// Material API
export const materialApi = {
  getAll: (params?: any) => api.get('/materials', { params }),
  getById: (id: string) => api.get(`/materials/${id}`),
  create: (data: any) => api.post('/materials', data),
  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

// Appointment API
export const appointmentApi = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  sendOtp: (id: string) => api.post(`/appointments/${id}/send-otp`),
  resendOtp: (id: string) => api.post(`/appointments/${id}/resend-otp`),
  verifyOtp: (id: string, otp: string) => api.post(`/appointments/${id}/verify-otp`, { otp }),
  getOtpWidgetToken: (id: string) => api.get(`/appointments/${id}/otp-widget-token`),
  verifyOtpWithWidget: (id: string, accessToken: string) => api.post(`/appointments/${id}/verify-otp-widget`, { accessToken }),
  submitFeedback: (id: string, feedback: string) => api.post(`/appointments/${id}/feedback`, { feedback }),
  getDashboard: () => api.get('/appointments/dashboard'),
  getDashboardStats: () => api.get('/appointments/dashboard/stats'),
  getReports: (params?: any) => api.get('/appointments/reports', { params }),
  export: (params?: any) => api.get('/appointments/export', { params, responseType: 'blob' }),
};

// Inventory API
export const inventoryApi = {
  getStock: (params?: any) => api.get('/inventory/stock', { params }),
  getTransactions: (params?: any) => api.get('/inventory/transactions', { params }),
  stockIn: (data: any) => api.post('/inventory/stock-in', data),
  stockOut: (data: any) => api.post('/inventory/stock-out', data),
  getTransaction: (id: string) => api.get(`/inventory/transactions/${id}`),
  getUsageReport: (params?: any) => api.get('/inventory/reports/usage', { params }),
  getBySiteReport: (params?: any) => api.get('/inventory/reports/by-site', { params }),
  getBalanceReport: (params?: any) => api.get('/inventory/reports/balance', { params }),
  export: (params?: any) => api.get('/inventory/export', { params, responseType: 'blob' }),
};

// Worker Visit API
export const workerVisitApi = {
  getAll: (params?: any) => api.get('/worker-visits/all', { params }),
  getById: (id: string) => api.get(`/worker-visits/${id}`),
  create: (data: any) => api.post('/worker-visits', data),
  resendOtp: (id: string) => api.post(`/worker-visits/${id}/resend-otp`),
  submitCount: (id: string, data: any) => api.post(`/worker-visits/${id}/submit-count`, data),
  getOtpWidgetToken: (id: string) => api.get(`/worker-visits/${id}/otp-widget-token`),
  submitCountWithWidget: (id: string, data: any) => api.post(`/worker-visits/${id}/submit-count-widget`, data),
  getPending: () => api.get('/worker-visits/pending'),
  getCompleted: (params?: any) => api.get('/worker-visits/completed', { params }),
  getSummaryReport: (params?: any) => api.get('/worker-visits/reports/summary', { params }),
  getBySiteReport: (params?: any) => api.get('/worker-visits/reports/by-site', { params }),
  getByDateReport: (params?: any) => api.get('/worker-visits/reports/by-date', { params }),
  export: (params?: any) => api.get('/worker-visits/export', { params, responseType: 'blob' }),
};
