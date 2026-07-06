import { describe, it, expect, vi, afterEach } from 'vitest';
import mw from '../src/middleware/rateLimit.js';

const { rateLimit } = mw;

// minimal Express req/res doubles
const mkRes = () => {
  const headers = {};
  let statusCode = 200;
  let body = null;
  return {
    set: (k, v) => { headers[k] = v; },
    status(c) { statusCode = c; return this; },
    json(b) { body = b; return this; },
    get headers() { return headers; },
    get statusCode() { return statusCode; },
    get body() { return body; },
  };
};
const call = (limiter, ip) => {
  const res = mkRes();
  let nexted = false;
  limiter({ ip }, res, () => { nexted = true; });
  return { res, nexted };
};

describe('rateLimit', () => {
  afterEach(() => vi.useRealTimers());

  it('allows requests up to max then blocks with 429 + Retry-After', () => {
    const limiter = rateLimit({ windowMs: 1000, max: 3, keyPrefix: 'u1' });
    for (let i = 0; i < 3; i++) {
      expect(call(limiter, '1.1.1.1').nexted).toBe(true);
    }
    const blocked = call(limiter, '1.1.1.1');
    expect(blocked.nexted).toBe(false);
    expect(blocked.res.statusCode).toBe(429);
    expect(blocked.res.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.res.headers['Retry-After']).toBeDefined();
  });

  it('tracks limits per-IP independently', () => {
    const limiter = rateLimit({ windowMs: 1000, max: 1, keyPrefix: 'u2' });
    expect(call(limiter, '2.2.2.2').nexted).toBe(true);
    expect(call(limiter, '2.2.2.2').nexted).toBe(false); // over
    expect(call(limiter, '3.3.3.3').nexted).toBe(true);  // different IP fresh
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    const limiter = rateLimit({ windowMs: 1000, max: 1, keyPrefix: 'u3' });
    expect(call(limiter, '4.4.4.4').nexted).toBe(true);
    expect(call(limiter, '4.4.4.4').nexted).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(call(limiter, '4.4.4.4').nexted).toBe(true);
  });

  it('exposes X-RateLimit-Remaining header', () => {
    const limiter = rateLimit({ windowMs: 1000, max: 5, keyPrefix: 'u4' });
    const { res } = call(limiter, '5.5.5.5');
    expect(res.headers['X-RateLimit-Limit']).toBe('5');
    expect(res.headers['X-RateLimit-Remaining']).toBe('4');
  });
});
