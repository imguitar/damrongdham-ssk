import axiosInstance from './axiosInstance';

export const list = (params) => axiosInstance.get('/agencies', { params });
export const getById = (id) => axiosInstance.get(`/agencies/${id}`);
export const create = (data) => axiosInstance.post('/agencies', data);
export const update = (id, data) => axiosInstance.put(`/agencies/${id}`, data);
export const toggleStatus = (id) => axiosInstance.patch(`/agencies/${id}/toggle-status`);
