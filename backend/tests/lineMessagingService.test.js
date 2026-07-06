import { describe, it, expect, vi, afterEach } from 'vitest';
import svc from '../src/services/lineMessagingService.js';

const okFetch = (body) => vi.fn(async () => ({ ok: true, status: 200, json: async () => body }));
const errFetch = (status, text = 'err') => vi.fn(async () => ({ ok: false, status, text: async () => text }));

describe('lineMessagingService', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('toRetryKey is deterministic and UUID-shaped', () => {
    const a = svc.toRetryKey('complaint:1:status:CLOSED:log:9');
    const b = svc.toRetryKey('complaint:1:status:CLOSED:log:9');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('classifies retryable vs non-retryable statuses', () => {
    expect(svc.isRetryableStatus(429)).toBe(true);
    expect(svc.isRetryableStatus(500)).toBe(true);
    expect(svc.isRetryableStatus(503)).toBe(true);
    expect(svc.isRetryableStatus(400)).toBe(false);
    expect(svc.isRetryableStatus(401)).toBe(false);
    expect(svc.isRetryableStatus(403)).toBe(false);
  });

  it('pushText succeeds on 200 and extracts provider message id', async () => {
    vi.stubGlobal('fetch', okFetch({ sentMessages: [{ id: 'MID-1' }] }));
    const r = await svc.pushText({ to: 'U1', text: 'hi', idempotencyKey: 'k1' });
    expect(r.ok).toBe(true);
    expect(r.providerMessageId).toBe('MID-1');
    expect(r.retryable).toBe(false);
  });

  it('pushText sends X-Line-Retry-Key derived from idempotencyKey', async () => {
    const f = okFetch({ sentMessages: [{ id: 'MID' }] });
    vi.stubGlobal('fetch', f);
    await svc.pushText({ to: 'U1', text: 'hi', idempotencyKey: 'abc' });
    const headers = f.mock.calls[0][1].headers;
    expect(headers['X-Line-Retry-Key']).toBe(svc.toRetryKey('abc'));
    expect(headers.Authorization).toMatch(/^Bearer /);
  });

  it('pushText marks 4xx as non-retryable', async () => {
    vi.stubGlobal('fetch', errFetch(400, 'bad request'));
    const r = await svc.pushText({ to: 'U1', text: 'hi' });
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(false);
    expect(r.errorCode).toBe('HTTP_400');
  });

  it('pushText marks 5xx as retryable', async () => {
    vi.stubGlobal('fetch', errFetch(500));
    const r = await svc.pushText({ to: 'U1', text: 'hi' });
    expect(r.retryable).toBe(true);
  });

  it('pushText treats 409 (retry-key conflict) as delivered', async () => {
    vi.stubGlobal('fetch', errFetch(409, 'dup'));
    const r = await svc.pushText({ to: 'U1', text: 'hi', idempotencyKey: 'k' });
    expect(r.ok).toBe(true);
  });

  it('pushText treats network errors as retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('boom'); }));
    const r = await svc.pushText({ to: 'U1', text: 'hi' });
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(true);
    expect(r.errorCode).toBe('NETWORK');
  });

  it('pushText guards empty recipient/text without calling fetch', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const r1 = await svc.pushText({ to: '', text: 'hi' });
    const r2 = await svc.pushText({ to: 'U1', text: '   ' });
    expect(r1.errorCode).toBe('INVALID_INPUT');
    expect(r2.errorCode).toBe('INVALID_INPUT');
    expect(f).not.toHaveBeenCalled();
  });

  it('isConfigured reflects the presence of the messaging token', () => {
    // token is set in the test env → configured
    expect(svc.isConfigured()).toBe(true);
  });
});
