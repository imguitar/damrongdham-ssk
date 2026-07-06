'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  LINE_AUTHORIZE_URL, LINE_TOKEN_URL, LINE_VERIFY_URL, LINE_ISSUER, config,
} = require('../config/line');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
const OAUTH_STATE_TTL = '10m';

// cryptographically secure random for state / nonce
const generateSecret = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// Pack state+nonce into a short-lived signed token kept in an HttpOnly cookie
// (stateless — no server-side session store required)
const createOAuthStateToken = ({ state, nonce }) =>
  jwt.sign({ state, nonce, purpose: 'line_oauth' }, JWT_SECRET, { expiresIn: OAUTH_STATE_TTL });

const readOAuthStateToken = (token) => {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.purpose !== 'line_oauth') throw new Error('invalid oauth state purpose');
  return payload;
};

const buildAuthorizationUrl = ({ state, nonce }) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.channelId,
    redirect_uri: config.callbackUrl,
    state,
    scope: config.scope,
    nonce,
  });
  if (config.botPrompt) params.set('bot_prompt', config.botPrompt);
  // LINE expects space-delimited scope encoded as %20 (URLSearchParams emits '+')
  return `${LINE_AUTHORIZE_URL}?${params.toString().replace(/\+/g, '%20')}`;
};

const safeText = async (resp) => {
  try { return (await resp.text()).slice(0, 300); } catch { return ''; }
};

// Exchange authorization code → token set. NEVER log the returned tokens.
const exchangeCodeForToken = async (code) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.callbackUrl,
    client_id: config.channelId,
    client_secret: config.channelSecret,
  });
  const resp = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) {
    throw Object.assign(new Error('LINE token exchange failed'), {
      code: 'LINE_TOKEN_EXCHANGE_FAILED', status: resp.status, detail: await safeText(resp),
    });
  }
  return resp.json(); // { access_token, id_token, refresh_token, ... }
};

// Verify ID token via LINE's official verify endpoint (checks signature/iss/aud/exp),
// then defensively re-check critical claims ourselves.
const verifyIdToken = async (idToken, expectedNonce) => {
  if (!idToken) throw Object.assign(new Error('missing id_token'), { code: 'LINE_INVALID_ID_TOKEN' });

  const body = new URLSearchParams({ id_token: idToken, client_id: config.channelId });
  if (expectedNonce) body.set('nonce', expectedNonce);

  const resp = await fetch(LINE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) {
    throw Object.assign(new Error('LINE ID token verification failed'), {
      code: 'LINE_INVALID_ID_TOKEN', status: resp.status, detail: await safeText(resp),
    });
  }

  const claims = await resp.json();
  if (claims.iss !== LINE_ISSUER) throw Object.assign(new Error('bad issuer'), { code: 'LINE_INVALID_ID_TOKEN' });
  if (String(claims.aud) !== String(config.channelId)) throw Object.assign(new Error('bad audience'), { code: 'LINE_INVALID_ID_TOKEN' });
  if (expectedNonce && claims.nonce !== expectedNonce) throw Object.assign(new Error('nonce mismatch'), { code: 'LINE_INVALID_ID_TOKEN' });
  if (!claims.sub) throw Object.assign(new Error('missing sub'), { code: 'LINE_INVALID_ID_TOKEN' });

  // sub = stable LINE user id (primary identity). name/picture = UX only.
  return { sub: claims.sub, name: claims.name || null, picture: claims.picture || null };
};

module.exports = {
  generateSecret,
  createOAuthStateToken,
  readOAuthStateToken,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  verifyIdToken,
};
