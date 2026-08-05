'use strict';

const crypto = require('crypto');
const { config } = require('../config/line');

// Official LINE Messaging API push endpoint
// ref: https://developers.line.biz/en/reference/messaging-api/#send-push-message
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
// Message content (images/files sent by users) lives on the data subdomain
// ref: https://developers.line.biz/en/reference/messaging-api/#get-content
const LINE_CONTENT_URL = (messageId) => `https://api-data.line.me/v2/bot/message/${encodeURIComponent(messageId)}/content`;
// Profile: 404 = ผู้ใช้ยังไม่ได้เพิ่ม OA เป็นเพื่อน (ใช้ตรวจว่าจะ push ถึงหรือไม่)
// ref: https://developers.line.biz/en/reference/messaging-api/#get-profile
const LINE_PROFILE_URL = (userId) => `https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`;
const LINE_BOT_INFO_URL = 'https://api.line.me/v2/bot/info';
const MAX_TEXT_LENGTH = 5000; // LINE text message limit
const MAX_MESSAGES_PER_REQUEST = 5; // LINE allows at most 5 message objects per call
const MAX_CONTENT_BYTES = 10 * 1024 * 1024; // mirrors config/upload multer limit

const isConfigured = () => Boolean(config.messagingAccessToken);

// Verify an inbound webhook request: base64(HMAC-SHA256(rawBody, channelSecret)) === X-Line-Signature
const verifyWebhookSignature = (rawBody, signature) => {
  if (!config.messagingChannelSecret || !signature || !rawBody) return false;
  const expected = crypto
    .createHmac('sha256', config.messagingChannelSecret)
    .update(rawBody)
    .digest('base64');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

// Trim a message list to what LINE accepts and clamp text length.
const normalizeMessages = (messages) =>
  (Array.isArray(messages) ? messages : [messages])
    .filter(Boolean)
    .slice(0, MAX_MESSAGES_PER_REQUEST)
    .map((m) => (m.type === 'text' ? { ...m, text: String(m.text || '').slice(0, MAX_TEXT_LENGTH) } : m));

// Reply within a webhook event with full message objects (text + quick replies).
// Never throws — a failed reply must not break webhook processing.
const replyMessages = async (replyToken, messages) => {
  const payload = normalizeMessages(messages);
  if (!isConfigured() || !replyToken || !payload.length) return { ok: false };
  try {
    const resp = await fetch(LINE_REPLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.messagingAccessToken}` },
      body: JSON.stringify({ replyToken, messages: payload }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: resp.ok, status: resp.status };
  } catch {
    return { ok: false };
  }
};

// Reply within a webhook event (uses the short-lived replyToken). Never throws.
const replyText = async (replyToken, text) => {
  if (!text) return { ok: false };
  return replyMessages(replyToken, [{ type: 'text', text }]);
};

// Derive a stable UUID-shaped retry key from our idempotency key so LINE also
// dedupes duplicate pushes across worker retries of the same outbox row.
// X-Line-Retry-Key requires UUID format.
const toRetryKey = (idempotencyKey) => {
  const h = crypto.createHash('sha256').update(String(idempotencyKey)).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

// Transient failures worth retrying: rate limit + server errors.
// 4xx (400/401/403) are config/logic errors → do NOT retry.
const isRetryableStatus = (status) => status === 429 || (status >= 500 && status <= 599);

// Send push message objects. Never throws; returns a structured result so the
// outbox worker can decide retry vs dead-letter.
// Result: { ok, providerMessageId, status, retryable, errorCode, errorMessage }
const pushMessages = async ({ to, messages, idempotencyKey }) => {
  if (!isConfigured()) {
    return { ok: false, retryable: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'LINE messaging not configured' };
  }
  if (!to) return { ok: false, retryable: false, errorCode: 'INVALID_INPUT', errorMessage: 'missing recipient' };

  const payload = normalizeMessages(messages);
  if (!payload.length || payload.some((m) => m.type === 'text' && !m.text.trim())) {
    return { ok: false, retryable: false, errorCode: 'INVALID_INPUT', errorMessage: 'empty text' };
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.messagingAccessToken}`, // never logged
  };
  if (idempotencyKey) headers['X-Line-Retry-Key'] = toRetryKey(idempotencyKey);

  const body = JSON.stringify({ to, messages: payload });

  let resp;
  try {
    resp = await fetch(LINE_PUSH_URL, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
  } catch (err) {
    // network error / timeout → transient
    return {
      ok: false, retryable: true, errorCode: 'NETWORK',
      errorMessage: err.name === 'TimeoutError' ? 'timeout' : 'network error',
    };
  }

  if (resp.ok) {
    let providerMessageId = null;
    try { const j = await resp.json(); providerMessageId = j?.sentMessages?.[0]?.id || null; } catch { /* ignore */ }
    return { ok: true, providerMessageId, status: resp.status, retryable: false };
  }

  // 409 = the retry key already succeeded before → treat as delivered (idempotent)
  if (resp.status === 409) {
    return { ok: true, providerMessageId: null, status: 409, retryable: false };
  }

  let detail = '';
  try { detail = (await resp.text()).slice(0, 300); } catch { /* ignore */ }
  return {
    ok: false,
    status: resp.status,
    retryable: isRetryableStatus(resp.status),
    errorCode: `HTTP_${resp.status}`,
    errorMessage: detail || `LINE push failed (${resp.status})`,
  };
};

// Send a single text push message (thin wrapper kept for existing callers).
const pushText = ({ to, text, idempotencyKey }) =>
  pushMessages({ to, messages: [{ type: 'text', text: text == null ? '' : String(text) }], idempotencyKey });

// Download media a user sent to the OA (image / file). Content is fetched
// server-side with the channel token — it is never exposed as a public URL.
// Result: { ok, buffer, contentType, errorCode, errorMessage }
const getMessageContent = async (messageId) => {
  if (!isConfigured()) return { ok: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'LINE messaging not configured' };
  if (!messageId) return { ok: false, errorCode: 'INVALID_INPUT', errorMessage: 'missing messageId' };

  let resp;
  try {
    resp = await fetch(LINE_CONTENT_URL(messageId), {
      headers: { Authorization: `Bearer ${config.messagingAccessToken}` }, // never logged
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    return { ok: false, errorCode: 'NETWORK', errorMessage: err.name === 'TimeoutError' ? 'timeout' : 'network error' };
  }

  if (!resp.ok) {
    return { ok: false, errorCode: `HTTP_${resp.status}`, errorMessage: `LINE content fetch failed (${resp.status})` };
  }

  // Reject oversized content before buffering when the server declares a length
  const declared = Number(resp.headers.get('content-length') || 0);
  if (declared && declared > MAX_CONTENT_BYTES) {
    return { ok: false, errorCode: 'FILE_TOO_LARGE', errorMessage: 'file exceeds size limit' };
  }

  let buffer;
  try {
    buffer = Buffer.from(await resp.arrayBuffer());
  } catch {
    return { ok: false, errorCode: 'READ_ERROR', errorMessage: 'cannot read content' };
  }
  if (buffer.length > MAX_CONTENT_BYTES) {
    return { ok: false, errorCode: 'FILE_TOO_LARGE', errorMessage: 'file exceeds size limit' };
  }

  return {
    ok: true,
    buffer,
    contentType: (resp.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(),
  };
};

// Friendship + profile lookup.
// LINE returns 404 for the profile endpoint when the user has NOT added the OA
// as a friend (or has blocked it) — which is exactly when push messages fail.
// Never throws. Result: { friend: true | false | null, displayName, pictureUrl }
//   friend === null  → ตรวจไม่ได้ (ยังไม่ตั้ง token / เครือข่ายมีปัญหา) — อย่าแสดงว่าไม่เป็นเพื่อน
const getFriendshipStatus = async (userId) => {
  if (!isConfigured() || !userId) return { friend: null, reason: 'not_configured' };
  let resp;
  try {
    resp = await fetch(LINE_PROFILE_URL(userId), {
      headers: { Authorization: `Bearer ${config.messagingAccessToken}` }, // never logged
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return { friend: null, reason: 'network' };
  }

  if (resp.ok) {
    let j = {};
    try { j = await resp.json(); } catch { /* ignore */ }
    return { friend: true, displayName: j?.displayName || null, pictureUrl: j?.pictureUrl || null };
  }
  // 404 = ไม่ได้เป็นเพื่อนกับ OA (หรือบล็อกไว้) → push ส่งไม่ถึงแน่นอน
  if (resp.status === 404) return { friend: false, reason: 'not_friend' };
  return { friend: null, reason: `http_${resp.status}` };
};

// Display name of a user who messaged the OA (UX only — identity is the userId).
// Never throws; returns null when unavailable.
const getProfile = async (userId) => {
  const res = await getFriendshipStatus(userId);
  if (!res.friend) return null;
  return { displayName: res.displayName || null, pictureUrl: res.pictureUrl || null };
};

// ลิงก์เพิ่มเพื่อน OA — ดึง basicId จาก LINE (cache ไว้ 1 ชั่วโมง ไม่ต้องตั้ง env เพิ่ม)
let botInfoCache = null;
let botInfoAt = 0;
const BOT_INFO_TTL_MS = 60 * 60 * 1000;

const getBotInfo = async () => {
  if (!isConfigured()) return null;
  if (botInfoCache && Date.now() - botInfoAt < BOT_INFO_TTL_MS) return botInfoCache;
  try {
    const resp = await fetch(LINE_BOT_INFO_URL, {
      headers: { Authorization: `Bearer ${config.messagingAccessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;
    const j = await resp.json();
    botInfoCache = {
      basicId: j?.basicId || null,
      displayName: j?.displayName || null,
      pictureUrl: j?.pictureUrl || null,
    };
    botInfoAt = Date.now();
    return botInfoCache;
  } catch {
    return null;
  }
};

// https://line.me/R/ti/p/@basicid — เปิดหน้าเพิ่มเพื่อนของ OA
const addFriendUrl = async () => {
  const info = await getBotInfo();
  const basicId = String(info?.basicId || '').trim();
  return basicId ? `https://line.me/R/ti/p/${basicId}` : null;
};

module.exports = {
  LINE_PUSH_URL,
  LINE_REPLY_URL,
  LINE_CONTENT_URL,
  MAX_TEXT_LENGTH,
  MAX_CONTENT_BYTES,
  isConfigured,
  toRetryKey,
  isRetryableStatus,
  pushText,
  pushMessages,
  getMessageContent,
  getProfile,
  getFriendshipStatus,
  getBotInfo,
  addFriendUrl,
  verifyWebhookSignature,
  replyText,
  replyMessages,
};
