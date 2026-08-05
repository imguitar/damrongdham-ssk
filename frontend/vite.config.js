import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // build ขึ้นให้อยู่ใต้ /damrongdham-ssk/ บน production server (nginx subpath)
    // dev server ยังรันที่ root ตามปกติ
    base: command === 'build' ? '/damrongdham-ssk/' : '/',
    plugins: [react()],
    server: {
      host: '0.0.0.0',    // ให้เข้าถึงจากนอก container ได้
      port: 5173,
      watch: {
        usePolling: true,  // จำเป็นสำหรับ Hot Reload บน Docker
      },
      proxy: {
        // Proxy API requests ไปยัง backend container
        // รัน backend นอก Docker: ตั้ง VITE_DEV_API_TARGET=http://localhost:5001 ใน frontend/.env
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://damrongdham-backend:5001',
          changeOrigin: true,
        },
      },
    },
  };
});
