import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',    // ให้เข้าถึงจากนอก container ได้
    port: 5173,
    watch: {
      usePolling: true,  // จำเป็นสำหรับ Hot Reload บน Docker
    },
    proxy: {
      // Proxy API requests ไปยัง backend container
      '/api': {
        target: 'http://damrongdham-backend:5001',
        changeOrigin: true,
      },
    },
  },
});
