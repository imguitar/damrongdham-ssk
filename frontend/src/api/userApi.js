import axiosInstance from './axiosInstance';

export const list = (params) => axiosInstance.get('/users', { params });
export const getById = (id) => axiosInstance.get(`/users/${id}`);
export const create = (data) => axiosInstance.post('/users', data);
export const update = (id, data) => axiosInstance.put(`/users/${id}`, data);
export const toggleStatus = (id) => axiosInstance.patch(`/users/${id}/toggle-status`);
export const resetPassword = (id, data) => axiosInstance.patch(`/users/${id}/reset-password`, data);
