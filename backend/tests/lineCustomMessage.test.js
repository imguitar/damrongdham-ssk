import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ctrl = require('../src/controllers/lineComplaintController.js');
const pool = require('../src/config/database.js');
const complaintModel = require('../src/models/complaintModel.js');
const identityModel = require('../src/models/citizenIdentityModel.js');
const prefModel = require('../src/models/notificationPrefModel.js');
const outboxSvc = require('../src/services/notificationOutboxService.js');

const mkRes = () => {
  const state = { statusCode: 200, body: null };
  return {
    status(code) { state.statusCode = code; return this; },
    json(body) { state.body = body; return this; },
    _state: state,
  };
};

const mkReq = (overrides = {}) => ({
  ip: '127.0.0.1',
  get: () => 'unit-test',
  body: {},
  params: { id: '7' },
  user: { id: 11, role: 'officer', agency_id: null },
  ...overrides,
});

const next = (err) => { if (err) throw err; };

const arrangeLinkedComplaint = ({ lineEnabled = 1 } = {}) => {
  vi.spyOn(complaintModel, 'findById').mockResolvedValue({ id: 7 });
  vi.spyOn(identityModel, 'findByCitizen').mockResolvedValue({ provider_user_id: 'U-test' });
  vi.spyOn(prefModel, 'getByCitizen').mockResolvedValue({ line_enabled: lineEnabled });
  vi.spyOn(outboxSvc, 'enqueue').mockResolvedValue(undefined);
  vi.spyOn(pool, 'query').mockImplementation(async (sql) => {
    if (String(sql).includes('SELECT citizen_id')) {
      return [[{ citizen_id: 21, complaint_number: 'DC-TEST-0001', status: 'IN_PROGRESS', is_anonymous: 0 }]];
    }
    return [[]];
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lineComplaintController.sendCustomMessage', () => {
  it('validates blank and over-limit messages before enqueue', async () => {
    vi.spyOn(complaintModel, 'findById').mockResolvedValue({ id: 7 });

    for (const message of ['   ', 'ก'.repeat(1001)]) {
      const res = mkRes();
      await ctrl.sendCustomMessage(mkReq({ body: { message } }), res, next);
      expect(res._state.statusCode).toBe(400);
      expect(res._state.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('trims and enqueues an authorized message without sending to LINE directly', async () => {
    arrangeLinkedComplaint();
    const res = mkRes();

    await ctrl.sendCustomMessage(
      mkReq({ body: { message: '  กรุณาติดต่อกลับภายในเวลาราชการ  ' } }),
      res,
      next
    );

    expect(res._state.statusCode).toBe(200);
    expect(outboxSvc.enqueue).toHaveBeenCalledTimes(1);
    expect(outboxSvc.enqueue).toHaveBeenCalledWith(null, expect.objectContaining({
      eventType: 'COMPLAINT_CUSTOM_MESSAGE',
      citizenId: 21,
      complaintId: 7,
      complaintNumber: 'DC-TEST-0001',
      extra: { customMessage: 'กรุณาติดต่อกลับภายในเวลาราชการ' },
      idempotencyKey: expect.stringMatching(/^complaint:7:custom:11:\d{12}:[a-f0-9]{16}$/),
    }));
  });

  it('rejects the message when the citizen disabled LINE notifications', async () => {
    arrangeLinkedComplaint({ lineEnabled: 0 });
    const res = mkRes();

    await ctrl.sendCustomMessage(mkReq({ body: { message: 'ข้อความทดสอบ' } }), res, next);

    expect(res._state.statusCode).toBe(400);
    expect(res._state.body.error.code).toBe('LINE_NOTIFICATIONS_DISABLED');
    expect(outboxSvc.enqueue).not.toHaveBeenCalled();
  });

  it('enforces complaint assignment scope for agency staff', async () => {
    vi.spyOn(complaintModel, 'findById').mockResolvedValue({ id: 7 });
    vi.spyOn(pool, 'query').mockResolvedValue([[]]);
    vi.spyOn(outboxSvc, 'enqueue').mockResolvedValue(undefined);
    const res = mkRes();

    await ctrl.sendCustomMessage(
      mkReq({
        user: { id: 12, role: 'agency_officer', agency_id: 99 },
        body: { message: 'ข้อความทดสอบ' },
      }),
      res,
      next
    );

    expect(res._state.statusCode).toBe(403);
    expect(outboxSvc.enqueue).not.toHaveBeenCalled();
  });
});
