import { describe, it, expect, vi, afterEach } from 'vitest';
import svc from '../src/services/lineLoginService.js';

const CHANNEL_ID = '1234567890';
const ISSUER = 'https://access.line.me';

const verifyFetch = (claims, ok = true, status = 200) =>
  vi.fn(async () => ({ ok, status, json: async () => claims, text: async () => 'err' }));

describe('lineLoginService', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('generateSecret returns 64-char hex', () => {
    const s = svc.generateSecret();
    expect(s).toMatch(/^[0-9a-f]{64}$/);
    expect(svc.generateSecret()).not.toBe(s); // random
  });

  it('state token round-trips state + nonce and rejects tampering', () => {
    const token = svc.createOAuthStateToken({ state: 'st', nonce: 'no' });
    const payload = svc.readOAuthStateToken(token);
    expect(payload.state).toBe('st');
    expect(payload.nonce).toBe('no');
    expect(payload.purpose).toBe('line_oauth');
    expect(() => svc.readOAuthStateToken('garbage.token.value')).toThrow();
  });

  it('buildAuthorizationUrl includes required params with space-encoded scope', () => {
    const url = svc.buildAuthorizationUrl({ state: 'S', nonce: 'N' });
    expect(url).toContain('https://access.line.me/oauth2/v2.1/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain(`client_id=${CHANNEL_ID}`);
    expect(url).toContain('scope=openid%20profile');
    expect(url).toContain('state=S');
    expect(url).toContain('nonce=N');
    expect(url).toContain('bot_prompt=aggressive');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5001');
  });

  it('verifyIdToken returns sub/name/picture on valid claims', async () => {
    vi.stubGlobal('fetch', verifyFetch({
      iss: ISSUER, aud: CHANNEL_ID, sub: 'U_abc', nonce: 'N1', name: 'ชื่อ', picture: 'http://p',
    }));
    const p = await svc.verifyIdToken('idtok', 'N1');
    expect(p).toEqual({ sub: 'U_abc', name: 'ชื่อ', picture: 'http://p' });
  });

  it('verifyIdToken rejects audience mismatch', async () => {
    vi.stubGlobal('fetch', verifyFetch({ iss: ISSUER, aud: 'OTHER', sub: 'U', nonce: 'N1' }));
    await expect(svc.verifyIdToken('idtok', 'N1')).rejects.toMatchObject({ code: 'LINE_INVALID_ID_TOKEN' });
  });

  it('verifyIdToken rejects issuer mismatch', async () => {
    vi.stubGlobal('fetch', verifyFetch({ iss: 'https://evil', aud: CHANNEL_ID, sub: 'U', nonce: 'N1' }));
    await expect(svc.verifyIdToken('idtok', 'N1')).rejects.toMatchObject({ code: 'LINE_INVALID_ID_TOKEN' });
  });

  it('verifyIdToken rejects nonce mismatch (replay protection)', async () => {
    vi.stubGlobal('fetch', verifyFetch({ iss: ISSUER, aud: CHANNEL_ID, sub: 'U', nonce: 'DIFFERENT' }));
    await expect(svc.verifyIdToken('idtok', 'N1')).rejects.toMatchObject({ code: 'LINE_INVALID_ID_TOKEN' });
  });

  it('verifyIdToken rejects when the verify endpoint fails', async () => {
    vi.stubGlobal('fetch', verifyFetch({}, false, 400));
    await expect(svc.verifyIdToken('idtok', 'N1')).rejects.toMatchObject({ code: 'LINE_INVALID_ID_TOKEN' });
  });

  it('exchangeCodeForToken throws a classified error on non-200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, text: async () => 'bad_code' })));
    await expect(svc.exchangeCodeForToken('code')).rejects.toMatchObject({ code: 'LINE_TOKEN_EXCHANGE_FAILED' });
  });
});
