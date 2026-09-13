import axiosInstance from './axiosInstance';

export const getEscalationSettings = () => axiosInstance.get('/settings', { params: { group: 'escalation' } });
export const updateEscalationSettings = (data) => axiosInstance.put('/settings', data);

