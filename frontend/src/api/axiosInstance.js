import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — inject JWT token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dcms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired / invalid)
// Skip redirect only for login/me themselves so their callers can handle errors
// directly (e.g., show "wrong password" on login page, silent me() check on boot).
// Other authenticated endpoints (e.g. /auth/line/link) still redirect on a real 401.
const NO_REDIRECT_401 = ['/auth/login', '/auth/me'];
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (
      error.response?.status === 401 &&
      !NO_REDIRECT_401.some((p) => url.endsWith(p))
    ) {
      localStorage.removeItem('dcms_token');
      localStorage.removeItem('dcms_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `${import.meta.env.BASE_URL}login`;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
