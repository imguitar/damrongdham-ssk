import { describe, it, expect, afterEach, vi } from 'vitest';
import controller from '../../src/controllers/lineAuthController.js';
import lineLoginService from '../../src/services/lineLoginService.js';
import { pool, dbAvailable, createStaffUser, cleanupUser } from '../integration/_helpers.js';

const DB = await dbAvailable();
const CHANNEL_ID = '1234567890';
const ISSUER = 'https://access.line.me';

const R = (status, body) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
const routeFetch = ({ token, verify }) => vi.stubGlobal('fetch', vi.fn(async (url) => {
  const u = String(url);
  if (u.includes('/oauth2/v2.1/token')) return token;
  if (u.includes('/oauth2/v2.1/verify')) return verify;
  throw new Error(`unexpected fetch: ${u}`);
}));
const mkRes = () => {
  const s = { redirectUrl: null, statusCode: 200, body: null, cookies: [] };
  return {
    redirect: (u) => { s.redirectUrl = u; },
    cookie: (n, v, o) => s.cookies.push({ set: n, v, o }),
    clearCookie: (n) => s.cookies.push({ clear: n }),
    status(c) { s.statusCode = c; return this; },
    json(b) { s.body = b; return this; },
    _s: s,
  };
};
const userLinkCookie = (state, nonce, linkUserId) =>
  `line_oauth=${lineLoginService.createOAuthStateToken({ state, nonce, linkUserId })}`;
const mkReq = (query, cookie) => ({ query, headers: { cookie, 'user-agent': 'vitest' }, ip: '127.0.0.1' });

const users = [];

(DB ? describe : describe.skip)('lineCallback — STAFF LINK MODE (DB)', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (users.length) await cleanupUser(users.pop());
  });

  it('links the LINE id to the bound staff user and redirects to the LINE settings page', async () => {
    const uid = await createStaffUser({ roleId: 1 }); users.push(uid);
    const sub = `Uslk_${Date.now()}`;
    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub, nonce: 'N', name: 'จนท' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, userLinkCookie('S', 'N', uid)), res);

    expect(res._s.redirectUrl).toContain('/line-notifications?line_linked=1');
    const [[idn]] = await pool.query('SELECT user_id FROM user_identities WHERE provider="line" AND provider_user_id=?', [sub]);
    expect(idn.user_id).toBe(uid);
  });

  it('rejects when the LINE id belongs to another staff user (conflict)', async () => {
    const owner = await createStaffUser({ roleId: 1 }); users.push(owner);
    const other = await createStaffUser({ roleId: 1 }); users.push(other);
    const sub = `Uslk_conf_${Date.now()}`;
    // pre-link to owner
    await pool.query('INSERT INTO user_identities (user_id, provider, provider_user_id) VALUES (?, "line", ?)', [owner, sub]);

    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub, nonce: 'N' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, userLinkCookie('S', 'N', other)), res);
    expect(res._s.redirectUrl).toContain('/line-notifications?line_error=line_identity_conflict');
  });
});

(DB ? describe : describe.skip)('staff DM preferences mass-assignment (security)', () => {
  afterEach(async () => { while (users.length) await cleanupUser(users.pop()); });

  it('PATCH only applies whitelisted columns', async () => {
    const uid = await createStaffUser({ roleId: 1 }); users.push(uid);
    const res = mkRes();
    await controller.updateUserNotificationPreferences(
      { user: { id: uid }, body: { notify_sla: 0, user_id: 999, id: 1, is_active: 0 } },
      res, (err) => { if (err) throw err; }
    );
    const p = res._s.body.data.preferences;
    expect(p.notify_sla).toBe(0);   // whitelisted applied
    expect(p.user_id).toBe(uid);    // injected user_id ignored
  });
});
