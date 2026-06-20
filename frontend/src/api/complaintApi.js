import axiosInstance from './axiosInstance';

export const list = (params) => axiosInstance.get('/complaints', { params });
export const getById = (id) => axiosInstance.get(`/complaints/${id}`);
export const create = (data) => axiosInstance.post('/complaints', data);
export const update = (id, data) => axiosInstance.put(`/complaints/${id}`, data);

// Workflow transitions
export const screen = (id, data) => axiosInstance.patch(`/complaints/${id}/screen`, data);
export const reject = (id, data) => axiosInstance.patch(`/complaints/${id}/reject`, data);
export const assign = (id, data) => axiosInstance.post(`/complaints/${id}/assign`, data);
export const review = (id, data) => axiosInstance.patch(`/complaints/${id}/review`, data);
export const close = (id, data) => axiosInstance.patch(`/complaints/${id}/close`, data);
export const sendBack = (id, data) => axiosInstance.patch(`/complaints/${id}/send-back`, data);
export const selfHandle = (id, data) => axiosInstance.patch(`/complaints/${id}/self-handle`, data);

// Assignment actions
export const getAssignments = (id) => axiosInstance.get(`/complaints/${id}/assignments`);

// Timeline & updates
export const getTimeline = (id) => axiosInstance.get(`/complaints/${id}/timeline`);
export const getUpdates = (id) => axiosInstance.get(`/complaints/${id}/updates`);
export const addUpdate = (id, data) => axiosInstance.post(`/complaints/${id}/updates`, data);

// Attachments
export const getAttachments = (id) => axiosInstance.get(`/complaints/${id}/attachments`);
export const uploadAttachment = (id, formData) =>
  axiosInstance.post(`/complaints/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteAttachment = (attachId) => axiosInstance.delete(`/complaints/attachments/${attachId}`);
export const downloadAttachment = (attachId) =>
  axiosInstance.get(`/complaints/attachments/${attachId}/download`, { responseType: 'blob' });

// Anonymous reveal (super_admin only)
export const revealIdentity = (id, data) => axiosInstance.post(`/complaints/${id}/reveal-identity`, data);
