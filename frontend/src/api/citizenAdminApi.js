import axiosInstance from './axiosInstance';

// จัดการสมาชิกประชาชน (super_admin)
export const list = (params) => axiosInstance.get('/admin/citizens', { params });
export const getById = (id) => axiosInstance.get(`/admin/citizens/${id}`);
export const update = (id, data) => axiosInstance.put(`/admin/citizens/${id}`, data);
export const setStatus = (id, is_active) => axiosInstance.patch(`/admin/citizens/${id}/status`, { is_active });
