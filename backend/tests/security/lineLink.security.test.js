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
  const s = { redirectUrl: null, statusCode: 200, jsonBody: null, cookies: [] };
  return {
    redirect: (u) => { s.redirectUrl = u; },
    cookie: (n, v, o) => s.cookies.push({ set: n, v, o }),
    clearCookie: (n) => s.cookies.push({ clear: n }),
    status(c) { s.statusCode = c; return this; },
    json(b) { s.jsonBody = b; return this; },
    _s: s,
  };
};
// signed cookie carrying the account to link (as lineLinkInit would set it)
const linkCookie = (state, nonce, linkCitizenId) =>
  `line_oauth=${lineLoginService.createOAuthStateToken({ state, nonce, linkCitizenId })}`;
const mkReq = (query, cookie, extra = {}) => ({ query, headers: { cookie, 'user-agent': 'vitest' }, ip: '127.0.0.1', ...extra });

describe('lineLinkInit — embeds account id in signed state cookie', () => {
  it('returns an authorize URL and sets a state cookie encoding linkCitizenId', () => {
    const res = mkRes();
    controller.lineLinkInit(mkReq({}, '', { citizen: { id: 777 } }), res);
    expect(res._s.jsonBody.data.authorizeUrl).toContain('access.line.me');
    const cookie = res._s.cookies.find((c) => c.set === 'line_oauth');
    expect(cookie).toBeTruthy();
    const payload = lineLoginService.readOAuthStateToken(cookie.v);
    expect(payload.linkCitizenId).toBe(777);
  });
});

(DB ? describe : describe.skip)('lineCallback — LINK MODE (DB)', () => {
  const cCitizens = [];
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (cCitizens.length) await cleanupCitizen(cCitizens.pop());
  });

  it('links the verified LINE id to the bound account and redirects line_linked=1', async () => {
    const cz = await createCitizen(); cCitizens.push(cz); // existing account, no LINE yet
    const sub = `Ulk_ok_${Date.now()}`;
    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub, nonce: 'N', name: 'ผู้ใช้' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, linkCookie('S', 'N', cz)), res);

    expect(res._s.redirectUrl).toContain('/citizen/notifications?line_linked=1');
    const [[idn]] = await pool.query(
      'SELECT citizen_id FROM citizen_identities WHERE provider="line" AND provider_user_id=?', [sub]);
    expect(idn.citizen_id).toBe(cz); // linked to the SAME account, no new account created
  });

  it('rejects when the LINE id is already owned by another account (conflict)', async () => {
    const owner = await createCitizen({ lineSub: `Ulk_conf_${Date.now()}` }); cCitizens.push(owner);
    const [[idn]] = await pool.query('SELECT provider_user_id FROM citizen_identities WHERE citizen_id=?', [owner]);
    const other = await createCitizen(); cCitizens.push(other);

    routeFetch({
      token: R(200, { id_token: 'idt' }),
      verify: R(200, { iss: ISSUER, aud: CHANNEL_ID, sub: idn.provider_user_id, nonce: 'N' }),
    });
    const res = mkRes();
    await controller.lineCallback(mkReq({ code: 'c', state: 'S' }, linkCookie('S', 'N', other)), res);

    expect(res._s.redirectUrl).toContain('line_error=line_identity_conflict');
    // still owned by the original account only
    const [[cnt]] = await pool.query(
      'SELECT COUNT(*) n FROM citizen_identities WHERE provider_user_id=?', [idn.provider_user_id]);
    expect(cnt.n).toBe(1);
  });
});
