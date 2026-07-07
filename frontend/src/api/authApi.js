import axiosInstance from './axiosInstance';

export const login = (username, password) =>
  axiosInstance.post('/auth/login', { username, password });

export const me = () =>
  axiosInstance.get('/auth/me');

export const logout = () =>
  axiosInstance.post('/auth/logout');

export const changePassword = (current_password, new_password) =>
  axiosInstance.put('/auth/change-password', { current_password, new_password });

// Staff personal LINE link + DM notification preferences
export const lineLinkStatus = () => axiosInstance.get('/auth/line/link');
export const lineLinkInit = () => axiosInstance.post('/auth/line/link/init');
export const lineUnlink = () => axiosInstance.delete('/auth/line/link');
export const getLineNotifPrefs = () => axiosInstance.get('/auth/line/preferences');
export const updateLineNotifPrefs = (data) => axiosInstance.patch('/auth/line/preferences', data);
