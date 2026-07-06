import { describe, it, expect, afterEach, vi } from 'vitest';
import controller from '../../src/controllers/lineAuthController.js';
import lineLoginService from '../../src/services/lineLoginService.js';
import { pool, dbAvailable, createCitizen, cleanupCitizen } from '../integration/_helpers.js';

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
  const s = { redirectUrl: null, cookies: [] };
  return {
    redirect: (u) => { s.redirectUrl = u; },
    cookie: (n, v, o) => s.cookies.push({ set: n, v, o }),
    clearCookie: (n) => s.cookies.push({ clear: n }),
    status() { return this; },
    json() { return this; },
    _s: s,
  };
};
// a genuine signed state cookie (controller verifies with the same JWT_SECRET)
const cookieFor = (state, nonce) => `line_oauth=${lineLoginService.createOAuthStateToken({ state, nonce })}`;
const mkReq = (query = {}, cookie = '') => ({ query, headers: { cookie, 'user-agent': 'vitest' }, ip: '127.0.0.1' });

describe('lineAuthController.lineCallback — guards (no DB)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('user cancel → line_login_cancelled', async () => {
    const res = mkRes();
    await controller.lineCallback(mkReq({ error: 'access_denied' }), res);
    expect(res._s.redirectUrl).toContain('line_error=line_login_cancelled');
  });

  it('missing code/state → line_callback_failed', async () => {
    const res = mkRes();
    await controller.lineCallback(mkReq({}), res);
    expect(res._s.redirectUrl).toContain('line_error=line_callback_failed');
  });

  it('missing state cookie → line_invalid_state', async () => {
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 's' }, ''), res);
    expect(res._s.redirectUrl).toContain('line_error=line_invalid_state');
  });

  it('forged/mismatched state → line_invalid_state, no token exchange (CSRF)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'ATTACKER' }, cookieFor('SERVER', 'N')), res);
    expect(res._s.redirectUrl).toContain('line_error=line_invalid_state');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('token exchange failure → line_token_exchange_failed', async () => {
    routeFetch({ token: R(400, { error: 'invalid_grant' }), verify: R(200, {}) });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, cookieFor('S', 'N')), res);
    expect(res._s.redirectUrl).toContain('line_error=line_token_exchange_failed');
  });

  it('invalid ID token → line_callback_failed', async () => {
    routeFetch({ token: R(200, { id_token: 'idt' }), verify: R(400, { error: 'bad' }) });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, cookieFor('S', 'N')), res);
    expect(res._s.redirectUrl).toContain('line_error=line_callback_failed');
  });

  it('rejects ID token with wrong nonce (replay) → line_callback_failed', async () => {
    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub: 'U', nonce: 'WRONG' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, cookieFor('S', 'N')), res);
    expect(res._s.redirectUrl).toContain('line_error=line_callback_failed');
  });
});

(DB ? describe : describe.skip)('lineAuthController.lineCallback — identity outcomes (DB)', () => {
  const cCitizens = [];
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (cCitizens.length) await cleanupCitizen(cCitizens.pop());
  });

  it('valid new login → redirect to frontend with token fragment + provisional flag', async () => {
    const sub = `Ucb_ok_${Date.now()}`;
    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub, nonce: 'N', name: 'ผู้ใช้' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, cookieFor('S', 'N')), res);

    expect(res._s.redirectUrl).toContain('/citizen/line/callback#');
    expect(res._s.redirectUrl).toMatch(/token=/);
    expect(res._s.redirectUrl).toContain('provisional=1');
    expect(res._s.cookies.some((c) => c.clear === 'line_oauth')).toBe(true);

    const [[idn]] = await pool.query(
      'SELECT citizen_id FROM citizen_identities WHERE provider="line" AND provider_user_id=?', [sub]);
    if (idn) cCitizens.push(idn.citizen_id);
    expect(idn).toBeTruthy();
  });

  it('disabled account → line_account_disabled', async () => {
    const sub = `Ucb_dis_${Date.now()}`;
    const cz = await createCitizen({ active: 0, lineSub: sub });
    cCitizens.push(cz);
    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub, nonce: 'N' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, cookieFor('S', 'N')), res);
    expect(res._s.redirectUrl).toContain('line_error=line_account_disabled');
  });
});
