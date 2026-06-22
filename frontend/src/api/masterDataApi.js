import axiosInstance from './axiosInstance';

// ── Categories ──────────────────────────────────────────────────────────────
export const listCategories = () => axiosInstance.get('/master-data/categories');
export const createCategory = (data) => axiosInstance.post('/master-data/categories', data);
export const updateCategory = (id, data) => axiosInstance.put(`/master-data/categories/${id}`, data);
export const toggleCategory = (id, is_active) => axiosInstance.patch(`/master-data/categories/${id}/toggle`, { is_active });

// ── Channels ─────────────────────────────────────────────────────────────────
export const listChannels = () => axiosInstance.get('/master-data/channels');
export const createChannel = (data) => axiosInstance.post('/master-data/channels', data);
export const updateChannel = (id, data) => axiosInstance.put(`/master-data/channels/${id}`, data);
export const toggleChannel = (id, is_active) => axiosInstance.patch(`/master-data/channels/${id}/toggle`, { is_active });

// ── Service Types ─────────────────────────────────────────────────────────────
export const listServiceTypes = () => axiosInstance.get('/master-data/service-types');
export const createServiceType = (data) => axiosInstance.post('/master-data/service-types', data);
export const updateServiceType = (id, data) => axiosInstance.put(`/master-data/service-types/${id}`, data);
export const toggleServiceType = (id, is_active) => axiosInstance.patch(`/master-data/service-types/${id}/toggle`, { is_active });

// ── Complaint Natures ─────────────────────────────────────────────────────────
export const listComplaintNatures = () => axiosInstance.get('/master-data/complaint-natures');
export const createComplaintNature = (data) => axiosInstance.post('/master-data/complaint-natures', data);
export const updateComplaintNature = (id, data) => axiosInstance.put(`/master-data/complaint-natures/${id}`, data);
export const toggleComplaintNature = (id, is_active) => axiosInstance.patch(`/master-data/complaint-natures/${id}/toggle`, { is_active });

// ── Complainant Types ─────────────────────────────────────────────────────────
export const listComplainantTypes = () => axiosInstance.get('/master-data/complainant-types');
export const createComplainantType = (data) => axiosInstance.post('/master-data/complainant-types', data);
export const updateComplainantType = (id, data) => axiosInstance.put(`/master-data/complainant-types/${id}`, data);
export const toggleComplainantType = (id, is_active) => axiosInstance.patch(`/master-data/complainant-types/${id}/toggle`, { is_active });

// ── Location (read-only) ──────────────────────────────────────────────────────
export const listProvinces = () => axiosInstance.get('/master-data/provinces');
export const listDistricts = (province_id) =>
  axiosInstance.get(`/master-data/districts/by-province/${province_id}`);
export const listSubdistricts = (district_id) =>
  axiosInstance.get(`/master-data/subdistricts/by-district/${district_id}`);
