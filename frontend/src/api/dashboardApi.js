import axiosInstance from './axiosInstance';

export const getSummary    = (params) => axiosInstance.get('/dashboard/summary',     { params });
export const getByStatus   = (params) => axiosInstance.get('/dashboard/by-status',   { params });
export const getByCategory = (params) => axiosInstance.get('/dashboard/by-category', { params });
export const getByAgency   = (params) => axiosInstance.get('/dashboard/by-agency',   { params });
export const getByDistrict = (params) => axiosInstance.get('/dashboard/by-district', { params });
export const getTrend      = (params) => axiosInstance.get('/dashboard/trend',        { params });
export const getOverdue    = (params) => axiosInstance.get('/dashboard/overdue',      { params });
export const getNearDue    = (params) => axiosInstance.get('/dashboard/near-due',     { params });
