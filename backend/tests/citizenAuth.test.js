import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';

// ใช้ require เพื่อให้ spy บน pool เป็น instance เดียวกับที่ middleware ใช้
const require = createRequire(import.meta.url);
const mw = require('../src/middleware/citizenAuth.js');
const pool = require('../src/config/database.js');
const authService = require('../src/services/authService.js');

const { citizenAuthenticate } = mw;

const mkRes = () => {
  const r = { statusCode: 200, body: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};
// ใช้ token จริง (ลงนามด้วย secret เดียวกับ middleware) แทนการ mock verifyToken
const mkReq = (payload) => ({ headers: { authorization: `Bearer ${authService.generateToken(payload)}` } });

afterEach(() => vi.restoreAllMocks());

describe('citizenAuthenticate', () => {
  it('passes an active citizen through', async () => {
    vi.spyOn(pool, 'query').mockResolvedValue([[{ is_active: 1 }]]);
    const req = mkReq({ id: 5, type: 'citizen' }); const res = mkRes(); const next = vi.fn();
    await citizenAuthenticate(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.citizen.id).toBe(5);
  });

  it('rejects a still-valid token once the account is disabled', async () => {
    vi.spyOn(pool, 'query').mockResolvedValue([[{ is_active: 0 }]]);
    const res = mkRes(); const next = vi.fn();
    await citizenAuthenticate(mkReq({ id: 5, type: 'citizen' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });

  it('rejects staff tokens without touching the database', async () => {
    const q = vi.spyOn(pool, 'query');
    const res = mkRes();
    await citizenAuthenticate(mkReq({ id: 1, type: 'staff' }), res, vi.fn());
    expect(res.statusCode).toBe(403);
    expect(q).not.toHaveBeenCalled();
  });
});
