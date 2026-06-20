import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Interceptors will be wired up in Phase 9 (auth token injection + 401 redirect)

export default axiosInstance;
