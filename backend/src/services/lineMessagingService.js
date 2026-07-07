'use strict';

const crypto = require('crypto');
const { config } = require('../config/line');

// Official LINE Messaging API push endpoint
// ref: https://developers.line.biz/en/reference/messaging-api/#send-push-message
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const MAX_TEXT_LENGTH = 5000; // LINE text message limit

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

// Reply within a webhook event (uses the short-lived replyToken). Never throws.
const replyText = async (replyToken, text) => {
  if (!isConfigured() || !replyToken || !text) return { ok: false };
  try {
    const resp = await fetch(LINE_REPLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.messagingAccessToken}` },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: text.slice(0, MAX_TEXT_LENGTH) }] }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: resp.ok, status: resp.status };
  } catch {
    return { ok: false };
  }
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

// Send one text push message. Never throws; returns a structured result so the
// outbox worker can decide retry vs dead-letter.
// Result: { ok, providerMessageId, status, retryable, errorCode, errorMessage }
const pushText = async ({ to, text, idempotencyKey }) => {
  if (!isConfigured()) {
    return { ok: false, retryable: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'LINE messaging not configured' };
  }
  if (!to) return { ok: false, retryable: false, errorCode: 'INVALID_INPUT', errorMessage: 'missing recipient' };
  if (!text || !text.trim()) return { ok: false, retryable: false, errorCode: 'INVALID_INPUT', errorMessage: 'empty text' };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.messagingAccessToken}`, // never logged
  };
  if (idempotencyKey) headers['X-Line-Retry-Key'] = toRetryKey(idempotencyKey);

  const body = JSON.stringify({ to, messages: [{ type: 'text', text: text.slice(0, MAX_TEXT_LENGTH) }] });

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

module.exports = {
  LINE_PUSH_URL,
  LINE_REPLY_URL,
  MAX_TEXT_LENGTH,
  isConfigured,
  toRetryKey,
  isRetryableStatus,
  pushText,
  verifyWebhookSignature,
  replyText,
};
