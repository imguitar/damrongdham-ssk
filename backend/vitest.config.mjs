import { defineConfig } from 'vitest/config';

// Test env — dummy LINE credentials so config/line loads as "configured".
// NEVER real secrets; unit tests must not call LINE production APIs.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret',
      LINE_LOGIN_CHANNEL_ID: '1234567890',
      LINE_LOGIN_CHANNEL_SECRET: 'test_login_secret',
      LINE_LOGIN_CALLBACK_URL: 'http://localhost:5001/api/citizen/auth/line/callback',
      LINE_LOGIN_BOT_PROMPT: 'aggressive',
      LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: 'test_messaging_token',
      LINE_MESSAGING_CHANNEL_SECRET: 'test_messaging_secret',
      FRONTEND_URL: 'http://localhost:5173',
      BACKEND_URL: 'http://localhost:5001',
    },
  },
});
