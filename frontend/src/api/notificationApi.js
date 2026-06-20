import axiosInstance from './axiosInstance';

export const getList       = (params) => axiosInstance.get('/notifications', { params });
export const getUnreadCount = ()       => axiosInstance.get('/notifications/unread-count');
export const markRead      = (id)      => axiosInstance.patch(`/notifications/${id}/read`);
export const markAllRead   = ()        => axiosInstance.patch('/notifications/read-all');
