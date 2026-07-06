'use strict';

// Lightweight in-memory fixed-window rate limiter (no external dependency).
// Suitable for the single-container deployment; for multi-instance scaling,
// swap the Map store for Redis.
const buckets = new Map(); // key -> { count, resetAt }

// Bound memory: drop expired buckets every minute
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}, 60 * 1000).unref();

const rateLimit = ({ windowMs, max, keyPrefix = 'rl', message } = {}) => (req, res, next) => {
  const now = Date.now();
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const key = `${keyPrefix}:${ip}`;

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  res.set('X-RateLimit-Limit', String(max));
  res.set('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));

  if (bucket.count > max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: message || 'คำขอมากเกินไป กรุณาลองใหม่อีกครั้งภายหลัง' },
    });
  }
  return next();
};

module.exports = { rateLimit };
