import axiosInstance from './axiosInstance';

export const getMonthly    = (params) => axiosInstance.get('/reports/monthly',     { params });
export const getByCategory = (params) => axiosInstance.get('/reports/by-category', { params });
export const getByAgency   = (params) => axiosInstance.get('/reports/by-agency',   { params });
export const getOverdue    = (params) => axiosInstance.get('/reports/overdue',      { params });
export const exportExcel   = (params) =>
  axiosInstance.get('/reports/export/excel', { params, responseType: 'blob' });
