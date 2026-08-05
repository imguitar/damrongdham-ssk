'use strict';

const authService = require('../services/authService');
const lineLoginService = require('../services/lineLoginService');
const identityService = require('../services/identityService');
const messaging = require('../services/lineMessagingService');
const userPrefModel = require('../models/userNotificationPrefModel');
const { isConfigured, config } = require('../config/line');
const { writeAuditLog } = require('../middleware/auditLog');
const { success, error } = require('../utils/response');

const OAUTH_COOKIE = 'line_oauth';
const isProd = () => process.env.NODE_ENV === 'production';

// เมื่อ deploy ใต้ subpath (Target B: https://host/<subpath>/api/...) เบราว์เซอร์เห็น
// path ที่รวม prefix ด้วย — cookie path จึงต้องรวม prefix ไม่เช่นนั้น cookie จะไม่ถูก
// ส่งกลับมาที่ callback และ state ตรวจไม่ผ่าน (line_invalid_state).
// ดึง prefix จาก BACKEND_URL (root deployment → prefix ว่าง = พฤติกรรมเดิม)
const basePathPrefix = (backendUrl) => {
  try {
    const p = new URL(backendUrl).pathname.replace(/\/+$/, '');
    return p === '/' ? '' : p;
  } catch {
    return ''; // URL ไม่ถูกต้อง → ใช้พฤติกรรมเดิม ไม่ทำให้ login พัง
  }
};

// จำกัดขอบเขต cookie ให้แคบที่สุดเท่าที่ callback ยังใช้งานได้
const cookiePathFor = (backendUrl) => `${basePathPrefix(backendUrl)}/api/citizen/auth/line`;
const cookiePath = () => cookiePathFor(config.backendUrl);

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax', // allow cookie on top-level GET redirect back from LINE
  secure: isProd(),
  path: cookiePath(),
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

// สถานะการเป็นเพื่อนกับ OA + ลิงก์เพิ่มเพื่อน — best effort ไม่ทำให้ endpoint ล้ม
const oaFriendship = async (providerUserId) => {
  try {
    const [status, url] = await Promise.all([
      messaging.getFriendshipStatus(providerUserId),
      messaging.addFriendUrl(),
    ]);
    return { friend: status.friend, addFriendUrl: url };
  } catch {
    return { friend: null, addFriendUrl: null };
  }
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
  const clearCookie = () => res.clearCookie(OAUTH_COOKIE, { path: cookiePath() });

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

    // 4a. STAFF LINK MODE — bound to an authenticated staff user at init time
    if (saved.linkUserId) {
      const staffSettings = `${config.frontendUrl}/line-notifications`;
      try {
        await identityService.linkLineToUser({
          userId: saved.linkUserId, sub: profile.sub,
          displayName: profile.name, pictureUrl: profile.picture,
        });
      } catch (e) {
        const map = { LINE_IDENTITY_CONFLICT: 'line_identity_conflict', LINE_ALREADY_LINKED: 'line_already_linked' };
        console.error('[LINE] staff link failed:', e.code || e.message);
        clearCookie();
        return res.redirect(`${staffSettings}?line_error=${encodeURIComponent(map[e.code] || 'line_callback_failed')}`);
      }
      writeAuditLog({
        userId: saved.linkUserId, action: 'USER_IDENTITY_LINKED', resource: 'user',
        resourceId: saved.linkUserId, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
      clearCookie();
      return res.redirect(`${staffSettings}?line_linked=1`);
    }

    // 4b. LINK MODE — bound to an authenticated citizen at init time (§9).
    // Link the verified LINE identity to that account instead of creating a new one.
    if (saved.linkCitizenId) {
      try {
        await identityService.linkLineToExisting({
          citizenId: saved.linkCitizenId, sub: profile.sub,
          displayName: profile.name, pictureUrl: profile.picture,
        });
      } catch (e) {
        const map = { LINE_IDENTITY_CONFLICT: 'line_identity_conflict', LINE_ALREADY_LINKED: 'line_already_linked' };
        console.error('[LINE] link failed:', e.code || e.message);
        clearCookie();
        return res.redirect(`${config.frontendUrl}/citizen/notifications?line_error=${encodeURIComponent(map[e.code] || 'line_callback_failed')}`);
      }
      writeAuditLog({
        userId: null, action: 'LINE_IDENTITY_LINKED', resource: 'citizen',
        resourceId: saved.linkCitizenId, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
      clearCookie();
      return res.redirect(`${config.frontendUrl}/citizen/notifications?line_linked=1`);
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

// POST /api/citizen/line/link/init — authenticated: start linking LINE to current account
const lineLinkInit = (req, res, next) => {
  try {
    if (!isConfigured()) {
      return error(res, 'LINE_NOT_CONFIGURED', 'ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อ LINE', 503);
    }
    const state = lineLoginService.generateSecret();
    const nonce = lineLoginService.generateSecret();
    const stateToken = lineLoginService.createOAuthStateToken({ state, nonce, linkCitizenId: req.citizen.id });
    res.cookie(OAUTH_COOKIE, stateToken, cookieOptions());
    return success(res, { authorizeUrl: lineLoginService.buildAuthorizationUrl({ state, nonce }) });
  } catch (err) {
    next(err);
  }
};

// GET /api/citizen/line/link — authenticated: current LINE link status
const lineLinkStatus = async (req, res, next) => {
  try {
    const idn = await identityService.getLineIdentity(req.citizen.id);
    // ผูกบัญชีแล้วยังไม่พอ — ต้อง "เพิ่มเพื่อน OA" ด้วย ไม่งั้น push ส่งไม่ถึง (LINE 403)
    const oa = idn ? await oaFriendship(idn.provider_user_id) : { friend: null, addFriendUrl: null };
    return success(res, {
      linked: Boolean(idn),
      displayName: idn?.display_name || null,
      linkedAt: idn?.linked_at || null,
      oaFriend: oa.friend,            // true / false / null (ตรวจไม่ได้)
      addFriendUrl: oa.addFriendUrl,  // ลิงก์เพิ่มเพื่อน OA (null ถ้ายังไม่ตั้งค่า messaging)
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/citizen/line/link — authenticated: unlink LINE from current account
const lineUnlink = async (req, res, next) => {
  try {
    const removed = await identityService.unlinkLine(req.citizen.id);
    if (removed) {
      writeAuditLog({
        userId: null, action: 'LINE_IDENTITY_UNLINKED', resource: 'citizen',
        resourceId: req.citizen.id, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
    }
    return success(res, { message: 'ยกเลิกการเชื่อมต่อ LINE แล้ว' });
  } catch (err) {
    next(err);
  }
};

// ── Staff personal LINE link (staff-authenticated) ────────────────────────────
// POST /api/auth/line/link/init
const staffLineLinkInit = (req, res, next) => {
  try {
    if (!isConfigured()) {
      return error(res, 'LINE_NOT_CONFIGURED', 'ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อ LINE', 503);
    }
    const state = lineLoginService.generateSecret();
    const nonce = lineLoginService.generateSecret();
    const stateToken = lineLoginService.createOAuthStateToken({ state, nonce, linkUserId: req.user.id });
    res.cookie(OAUTH_COOKIE, stateToken, cookieOptions());
    return success(res, { authorizeUrl: lineLoginService.buildAuthorizationUrl({ state, nonce }) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/line/link
const staffLineLinkStatus = async (req, res, next) => {
  try {
    const idn = await identityService.getUserLineIdentity(req.user.id);
    const oa = idn ? await oaFriendship(idn.provider_user_id) : { friend: null, addFriendUrl: null };
    return success(res, {
      linked: Boolean(idn),
      displayName: idn?.display_name || null,
      linkedAt: idn?.linked_at || null,
      oaFriend: oa.friend,
      addFriendUrl: oa.addFriendUrl,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/line/link
const staffLineUnlink = async (req, res, next) => {
  try {
    const removed = await identityService.unlinkLineUser(req.user.id);
    if (removed) {
      writeAuditLog({
        userId: req.user.id, action: 'USER_IDENTITY_UNLINKED', resource: 'user',
        resourceId: req.user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
    }
    return success(res, { message: 'ยกเลิกการเชื่อมต่อ LINE แล้ว' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/line/preferences — staff DM notification preferences
const getUserNotificationPreferences = async (req, res, next) => {
  try {
    let pref = await userPrefModel.getByUser(req.user.id);
    if (!pref) {
      await userPrefModel.createDefault(null, req.user.id);
      pref = await userPrefModel.getByUser(req.user.id);
    }
    return success(res, { preferences: pref });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/line/preferences
const updateUserNotificationPreferences = async (req, res, next) => {
  try {
    await userPrefModel.createDefault(null, req.user.id);
    await userPrefModel.update(req.user.id, req.body); // whitelisted columns only
    const pref = await userPrefModel.getByUser(req.user.id);
    return success(res, { preferences: pref });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  cookiePath, cookiePathFor, // exported for tests (subpath deployments)
  lineLogin, lineCallback, lineLinkInit, lineLinkStatus, lineUnlink,
  staffLineLinkInit, staffLineLinkStatus, staffLineUnlink,
  getUserNotificationPreferences, updateUserNotificationPreferences,
};
