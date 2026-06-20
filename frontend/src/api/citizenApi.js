import axios from 'axios';

// Citizen API uses separate axios instance with citizen JWT
const citizenAxios = axios.create({
  baseURL: '/api/citizen',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

citizenAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('dcms_citizen_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

citizenAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('dcms_citizen_token');
      localStorage.removeItem('dcms_citizen_user');
      if (!window.location.pathname.includes('/citizen/login')) {
        window.location.href = '/citizen/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => citizenAxios.post('/auth/register', data);
export const login = (email, password) => citizenAxios.post('/auth/login', { email, password });
export const logout = () => citizenAxios.post('/auth/logout');
export const me = () => citizenAxios.get('/auth/me');
export const changePassword = (current_password, new_password) =>
  citizenAxios.put('/auth/change-password', { current_password, new_password });

// Profile
export const updateProfile = (data) => citizenAxios.put('/profile', data);

// Complaints
export const submitComplaint = (data) => citizenAxios.post('/complaints', data);
export const listMyComplaints = (params) => citizenAxios.get('/complaints', { params });
export const getMyComplaint = (complaint_number) =>
  citizenAxios.get(`/complaints/${complaint_number}`);
export const uploadAttachment = (formData) =>
  citizenAxios.post('/complaints/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default citizenAxios;
