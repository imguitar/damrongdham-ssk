import { describe, it, expect, afterEach } from 'vitest';
import citizenController from '../../src/controllers/citizenController.js';
import { dbAvailable, createCitizen, createComplaint, cleanupCitizen, cleanupComplaint } from '../integration/_helpers.js';

const DB = await dbAvailable();

const mkRes = () => {
  const state = { statusCode: 200, body: null };
  return {
    status(c) { state.statusCode = c; return this; },
    json(b) { state.body = b; return this; },
    _s: state,
  };
};
const nextErr = () => { let e = null; const fn = (err) => { e = err; }; fn.get = () => e; return fn; };

const cCitizens = [];
const cComplaints = [];

(DB ? describe : describe.skip)('citizen complaint ownership / IDOR (security)', () => {
  afterEach(async () => {
    while (cComplaints.length) await cleanupComplaint(cComplaints.pop());
    while (cCitizens.length) await cleanupCitizen(cCitizens.pop());
  });

  it('owner can read their own complaint', async () => {
    const owner = await createCitizen(); cCitizens.push(owner);
    const { id, number } = await createComplaint({ citizenId: owner }); cComplaints.push(id);

    const res = mkRes();
    await citizenController.getMyComplaint({ params: { complaint_number: number }, citizen: { id: owner } }, res, nextErr());
    expect(res._s.statusCode).toBe(200);
    expect(res._s.body.success).toBe(true);
  });

  it('a different citizen is denied (403) — no IDOR', async () => {
    const owner = await createCitizen(); cCitizens.push(owner);
    const attacker = await createCitizen(); cCitizens.push(attacker);
    const { id, number } = await createComplaint({ citizenId: owner }); cComplaints.push(id);

    const res = mkRes();
    await citizenController.getMyComplaint({ params: { complaint_number: number }, citizen: { id: attacker } }, res, nextErr());
    expect(res._s.statusCode).toBe(403);
    expect(res._s.body.error.code).toBe('FORBIDDEN');
  });
});

(DB ? describe : describe.skip)('notification preferences mass-assignment (security)', () => {
  afterEach(async () => { while (cCitizens.length) await cleanupCitizen(cCitizens.pop()); });

  it('PATCH only applies whitelisted columns and ignores injected fields', async () => {
    const cz = await createCitizen({ provisional: 1 }); cCitizens.push(cz);
    const res = mkRes();
    await citizenController.updateNotificationPreferences(
      { citizen: { id: cz }, body: { notify_status_change: 0, is_provisional: 0, id: 99999, citizen_id: 1 } },
      res, nextErr()
    );
    expect(res._s.statusCode).toBe(200);
    const prefs = res._s.body.data.preferences;
    expect(prefs.notify_status_change).toBe(0); // whitelisted applied
    expect(prefs.citizen_id).toBe(cz);          // injected citizen_id ignored
    expect(prefs.id).not.toBe(99999);           // injected id ignored
  });
});
