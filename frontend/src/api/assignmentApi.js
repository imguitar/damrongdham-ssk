import axiosInstance from './axiosInstance';

export const accept = (id, data) => axiosInstance.patch(`/assignments/${id}/accept`, data);
export const returnComplaint = (id, data) => axiosInstance.patch(`/assignments/${id}/return`, data);
export const start = (id, data) => axiosInstance.patch(`/assignments/${id}/start`, data);
export const resolve = (id, data) => axiosInstance.patch(`/assignments/${id}/resolve`, data);
