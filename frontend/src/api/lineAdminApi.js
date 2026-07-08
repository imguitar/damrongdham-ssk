import axiosInstance from './axiosInstance';

// Staff console — manage LINE group notification targets
export const createPairingCode = (data) => axiosInstance.post('/admin/line-groups/pairing-code', data);
export const listGroups = () => axiosInstance.get('/admin/line-groups');
export const updateGroup = (id, data) => axiosInstance.patch(`/admin/line-groups/${id}`, data);
export const deleteGroup = (id) => axiosInstance.delete(`/admin/line-groups/${id}`);
