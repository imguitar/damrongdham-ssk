import axiosInstance from './axiosInstance';

// Public master data (no auth required)
export const getCategories = () => axiosInstance.get('/public/master-data/categories');
export const getChannels = () => axiosInstance.get('/public/master-data/channels');
export const getProvinces = () => axiosInstance.get('/public/master-data/provinces');
export const getDistricts = () => axiosInstance.get('/public/master-data/districts');
export const getSubdistricts = (district_id) =>
  axiosInstance.get('/public/master-data/subdistricts', { params: { district_id } });
export const getServiceTypes = () => axiosInstance.get('/public/master-data/service-types');
export const getComplaintNatures = () => axiosInstance.get('/public/master-data/complaint-natures');
export const getComplainantTypes = () => axiosInstance.get('/public/master-data/complainant-types');

// Public complaint
export const submitComplaint = (data) => axiosInstance.post('/public/complaints', data);
export const uploadAttachment = (formData) =>
  axiosInstance.post('/public/complaints/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const trackComplaint = (complaint_number) =>
  axiosInstance.get(`/public/complaints/track/${complaint_number}`);
