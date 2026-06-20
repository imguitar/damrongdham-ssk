import axiosInstance from './axiosInstance';

export const login = (username, password) =>
  axiosInstance.post('/auth/login', { username, password });

export const me = () =>
  axiosInstance.get('/auth/me');

export const logout = () =>
  axiosInstance.post('/auth/logout');

export const changePassword = (current_password, new_password) =>
  axiosInstance.put('/auth/change-password', { current_password, new_password });
