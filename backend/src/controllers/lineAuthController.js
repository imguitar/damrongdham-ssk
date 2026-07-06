'use strict';

const authService = require('../services/authService');
const lineLoginService = require('../services/lineLoginService');
const identityService = require('../services/identityService');
const { isConfigured, config } = require('../config/line');
const { writeAuditLog } = require('../middleware/auditLog');
const { error } = require('../utils/response');

const OAUTH_COOKIE = 'line_oauth';
const COOKIE_PATH = '/api/citizen/auth/line';
const isProd = () => process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax', // allow cookie on top-level GET redirect back from LINE
  secure: isProd(),
  path: COOKIE_PATH,
  maxAge: 10 * 60 * 1000,
});

// Minimal cookie reader (project doesn't use cookie-parser)
const readCookie = (req, name) => {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
};

const redirectError = (res, code) =>
  res.redirect(`${config.frontendUrl}/citizen/login?line_error=${encodeURIComponent(code)}`);

// GET /api/citizen/auth/line — start LINE Login
const lineLogin = (req, res, next) => {
  try {
    if (!isConfigured()) {
      return error(res, 'LINE_NOT_CONFIGURED', 'ระบบยังไม่ได้ตั้งค่าการเข้าสู่ระบบด้วย LINE', 503);
    }
    const state = lineLoginService.generateSecret();
    const nonce = lineLoginService.generateSecret();
    const stateToken = lineLoginService.createOAuthStateToken({ state, nonce });

    res.cookie(OAUTH_COOKIE, stateToken, cookieOptions());
    return res.redirect(lineLoginService.buildAuthorizationUrl({ state, nonce }));
  } catch (err) {
    next(err);
  }
};

// GET /api/citizen/auth/line/callback — LINE redirects back here
const lineCallback = async (req, res) => {
  const { code, state, error: lineError } = req.query;
  const clearCookie = () => res.clearCookie(OAUTH_COOKIE, { path: COOKIE_PATH });

  try {
    // 1. user cancelled / LINE returned an error
    if (lineError) { clearCookie(); return redirectError(res, 'line_login_cancelled'); }
    if (!code || !state) { clearCookie(); return redirectError(res, 'line_callback_failed'); }

    // 2. validate state against the signed cookie (CSRF protection)
    const cookieToken = readCookie(req, OAUTH_COOKIE);
    if (!cookieToken) { clearCookie(); return redirectError(res, 'line_invalid_state'); }

    let saved;
    try { saved = lineLoginService.readOAuthStateToken(cookieToken); }
    catch { clearCookie(); return redirectError(res, 'line_invalid_state'); }
    if (saved.state !== state) { clearCookie(); return redirectError(res, 'line_invalid_state'); }

    // 3. exchange code for tokens
    let tokenSet;
    try {
      tokenSet = await lineLoginService.exchangeCodeForToken(code);
    } catch (e) {
      console.error('[LINE] token exchange failed:', e.code, e.status || '');
      clearCookie(); return redirectError(res, 'line_token_exchange_failed');
    }

    // 4. verify ID token (signature/iss/aud/exp/nonce)
    let profile;
    try {
      profile = await lineLoginService.verifyIdToken(tokenSet.id_token, saved.nonce);
    } catch (e) {
      console.error('[LINE] id token verify failed:', e.code, e.status || '');
      clearCookie(); return redirectError(res, 'line_callback_failed');
    }

    // 5. map LINE identity → internal citizen
    let result;
    try {
      result = await identityService.resolveLineIdentity({
        sub: profile.sub, displayName: profile.name, pictureUrl: profile.picture,
      });
    } catch (e) {
      const map = {
        LINE_ACCOUNT_DISABLED: 'line_account_disabled',
        LINE_IDENTITY_CONFLICT: 'line_identity_conflict',
      };
      console.error('[LINE] identity resolve failed:', e.code || e.message);
      clearCookie(); return redirectError(res, map[e.code] || 'line_callback_failed');
    }

    // 6. issue our own citizen session token (same as local citizen login)
    const jwtToken = authService.generateToken({ id: result.citizenId, type: 'citizen', provider: 'line' });

    writeAuditLog({
      userId: null,
      action: result.isNew ? 'LINE_IDENTITY_CREATED' : 'LINE_LOGIN_SUCCESS',
      resource: 'citizen',
      resourceId: result.citizenId,
      details: { isNew: result.isNew, isProvisional: result.isProvisional },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // 7. hand the token to the SPA via URL fragment (not sent to server / not logged)
    clearCookie();
    const params = new URLSearchParams({
      token: jwtToken,
      provisional: result.isProvisional ? '1' : '0',
    });
    return res.redirect(`${config.frontendUrl}/citizen/line/callback#${params.toString()}`);
  } catch (err) {
    console.error('[LINE] callback fatal:', err.message);
    clearCookie();
    writeAuditLog({
      userId: null, action: 'LINE_LOGIN_FAILED', resource: 'citizen',
      details: { message: err.message }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });
    return redirectError(res, 'line_callback_failed');
  }
};

module.exports = { lineLogin, lineCallback };
