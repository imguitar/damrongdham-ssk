'use strict';

// Official LINE Platform endpoints (LINE Login v2.1 / OpenID Connect)
// ref: https://developers.line.biz/en/docs/line-login/integrate-line-login/
const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';
const LINE_ISSUER = 'https://access.line.me';

const config = {
  channelId: process.env.LINE_LOGIN_CHANNEL_ID || '',
  channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET || '',
  callbackUrl: process.env.LINE_LOGIN_CALLBACK_URL || '',
  messagingAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5001',
  // bot_prompt=aggressive → ชวน add friend OA ทันทีหลังยินยอม เพื่อให้ push แจ้งเตือนทำงาน
  // (Messaging API push ส่งได้เฉพาะผู้ที่เป็นเพื่อนกับ OA). ระบบร้องเรียนภาครัฐเน้นให้ประชาชน
  // ได้รับการแจ้งเตือนความคืบหน้า จึงเลือก aggressive; ผู้ใช้ยังกดข้ามได้
  botPrompt: process.env.LINE_LOGIN_BOT_PROMPT || 'aggressive',
  scope: 'openid profile',
};

// LINE Login ใช้งานได้เมื่อมี channel id/secret/callback ครบ
const isConfigured = () => Boolean(config.channelId && config.channelSecret && config.callbackUrl);

module.exports = {
  LINE_AUTHORIZE_URL,
  LINE_TOKEN_URL,
  LINE_VERIFY_URL,
  LINE_ISSUER,
  config,
  isConfigured,
};
