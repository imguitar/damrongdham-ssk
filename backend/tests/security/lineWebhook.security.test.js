import { describe, it, expect, afterEach } from 'vitest';
import crypto from 'node:crypto';
import messaging from '../../src/services/lineMessagingService.js';
import adminCtrl from '../../src/controllers/lineGroupAdminController.js';
import { pool, dbAvailable } from '../integration/_helpers.js';

const SECRET = 'test_messaging_secret'; // matches vitest.config env
const DB = await dbAvailable();

const sign = (body) => crypto.createHmac('sha256', SECRET).update(body).digest('base64');

const mkRes = () => {
  const s = { statusCode: 200, body: null };
  return { status(c) { s.statusCode = c; return this; }, json(b) { s.body = b; return this; }, _s: s };
};
const next = () => (err) => { if (err) throw err; };

describe('LINE webhook signature verification', () => {
  it('accepts a correctly signed body', () => {
    const body = JSON.stringify({ events: [] });
    expect(messaging.verifyWebhookSignature(Buffer.from(body), sign(body))).toBe(true);
  });
  it('rejects a wrong signature', () => {
    const body = JSON.stringify({ events: [] });
    expect(messaging.verifyWebhookSignature(Buffer.from(body), 'wrong')).toBe(false);
  });
  it('rejects a tampered body', () => {
    const sig = sign(JSON.stringify({ events: [] }));
    expect(messaging.verifyWebhookSignature(Buffer.from(JSON.stringify({ events: [{ x: 1 }] })), sig)).toBe(false);
  });
  it('rejects when signature is missing', () => {
    expect(messaging.verifyWebhookSignature(Buffer.from('{}'), undefined)).toBe(false);
  });
});

describe('pairing-code authorization (no DB needed for deny paths)', () => {
  it('agency staff cannot create a center-scope code', async () => {
    const res = mkRes();
    await adminCtrl.createPairingCode(
      { user: { id: 1, role: 'agency_head', agency_id: 5 }, body: { scope: 'center' } }, res, next());
    expect(res._s.statusCode).toBe(403);
  });

  it('agency staff cannot create a code for another agency', async () => {
    const res = mkRes();
    await adminCtrl.createPairingCode(
      { user: { id: 1, role: 'agency_head', agency_id: 5 }, body: { scope: 'agency', agency_id: 6 } }, res, next());
    expect(res._s.statusCode).toBe(403);
  });

  it('rejects an invalid scope', async () => {
    const res = mkRes();
    await adminCtrl.createPairingCode(
      { user: { id: 1, role: 'super_admin' }, body: { scope: 'nonsense' } }, res, next());
    expect(res._s.statusCode).toBe(400);
  });
});

(DB ? describe : describe.skip)('pairing-code creation (DB)', () => {
  afterEach(async () => { await pool.query('DELETE FROM line_group_pairing_codes WHERE label = "sec-itest"'); });

  it('admin can create a center pairing code', async () => {
    const [[u]] = await pool.query('SELECT id FROM users WHERE role_id=1 LIMIT 1');
    const res = mkRes();
    await adminCtrl.createPairingCode(
      { user: { id: u.id, role: 'super_admin' }, body: { scope: 'center', label: 'sec-itest' } }, res, next());
    expect(res._s.statusCode).toBe(201);
    expect(res._s.body.data.code).toMatch(/^[A-Z0-9]{8}$/);
    expect(res._s.body.data.scope).toBe('center');
  });
});
