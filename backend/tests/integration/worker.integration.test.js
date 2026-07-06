import { describe, it, expect, afterEach, vi } from 'vitest';
import job from '../../src/jobs/notificationOutboxJob.js';
import prefModel from '../../src/models/notificationPrefModel.js';
import {
  pool, dbAvailable, createCitizen, createComplaint, getLogs, cleanupComplaint, cleanupCitizen,
} from './_helpers.js';

const DB = await dbAvailable();
const cComplaints = [];
const cCitizens = [];

// Stub the network layer (global fetch) so the REAL lineMessagingService runs but
// never hits LINE — avoids module-instance issues with mocking the service directly.
const res = (status, body) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
const stubPush = (status, body) => vi.stubGlobal('fetch', vi.fn(async () => res(status, body)));

const enqueueRow = async ({ citizenId, complaintId, event = 'COMPLAINT_STATUS_CHANGED', attempt = 0, key }) => {
  const [r] = await pool.query(
    `INSERT INTO notification_outbox (event_type, citizen_id, complaint_id, channel, payload, idempotency_key, attempt_count, status, next_attempt_at)
     VALUES (?, ?, ?, 'line', ?, ?, ?, 'pending', NOW())`,
    [event, citizenId, complaintId, JSON.stringify({ complaintNumber: 'ITEST-W', status: 'NEW' }), key, attempt]
  );
  const [[row]] = await pool.query('SELECT * FROM notification_outbox WHERE id=?', [r.insertId]);
  return row;
};
const rowAfter = async (id) => (await pool.query('SELECT * FROM notification_outbox WHERE id=?', [id]))[0][0];

(DB ? describe : describe.skip)('notificationOutboxJob.processRow (DB, fetch-stubbed)', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (cComplaints.length) await cleanupComplaint(cComplaints.pop());
    while (cCitizens.length) await cleanupCitizen(cCitizens.pop());
  });

  const setup = async ({ withIdentity = true, prefs = true } = {}) => {
    const cz = await createCitizen({ lineSub: withIdentity ? `Uw_${Date.now()}_${Math.random()}` : null });
    cCitizens.push(cz);
    if (prefs) await prefModel.createDefault(null, cz);
    const { id } = await createComplaint({ citizenId: cz }); cComplaints.push(id);
    return { cz, complaintId: id };
  };

  it('sends successfully → outbox sent + log sent with provider id', async () => {
    const { cz, complaintId } = await setup();
    stubPush(200, { sentMessages: [{ id: 'MID-9' }] });
    const row = await enqueueRow({ citizenId: cz, complaintId, key: `w:sent:${complaintId}` });

    expect(await job.processRow(row)).toBe('sent');
    const after = await rowAfter(row.id);
    expect(after.status).toBe('sent');
    expect(after.attempt_count).toBe(1);
    const logs = await getLogs(complaintId);
    expect(logs[0].status).toBe('sent');
    expect(logs[0].provider_message_id).toBe('MID-9');
  });

  it('preference disabled → cancelled, push not called', async () => {
    const { cz, complaintId } = await setup();
    await pool.query('UPDATE notification_preferences SET notify_status_change=0 WHERE citizen_id=?', [cz]);
    const fetchSpy = vi.fn(async () => res(200, {}));
    vi.stubGlobal('fetch', fetchSpy);
    const row = await enqueueRow({ citizenId: cz, complaintId, key: `w:pref:${complaintId}` });

    expect(await job.processRow(row)).toBe('cancelled');
    expect((await rowAfter(row.id)).status).toBe('cancelled');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('no LINE identity → cancelled', async () => {
    const { cz, complaintId } = await setup({ withIdentity: false });
    const fetchSpy = vi.fn(async () => res(200, {}));
    vi.stubGlobal('fetch', fetchSpy);
    const row = await enqueueRow({ citizenId: cz, complaintId, key: `w:noid:${complaintId}` });
    expect(await job.processRow(row)).toBe('cancelled');
    expect((await rowAfter(row.id)).last_error).toBe('no_line_identity');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('retryable failure (5xx) → retry with future next_attempt_at + attempt incremented', async () => {
    const { cz, complaintId } = await setup();
    stubPush(500, { message: 'server error' });
    const row = await enqueueRow({ citizenId: cz, complaintId, attempt: 0, key: `w:retry:${complaintId}` });

    expect(await job.processRow(row)).toBe('retried');
    const after = await rowAfter(row.id);
    expect(after.status).toBe('retry');
    expect(after.attempt_count).toBe(1);
    expect(new Date(after.next_attempt_at).getTime()).toBeGreaterThan(Date.now() + 30000);
  });

  it('exhausted retries → failed (dead-letter) + failed log', async () => {
    const { cz, complaintId } = await setup();
    stubPush(500, { message: 'server error' });
    const row = await enqueueRow({ citizenId: cz, complaintId, attempt: 4, key: `w:exh:${complaintId}` });

    expect(await job.processRow(row)).toBe('failed');
    expect((await rowAfter(row.id)).status).toBe('failed');
    expect((await getLogs(complaintId))[0].status).toBe('failed');
  });

  it('non-retryable failure (4xx) → failed immediately', async () => {
    const { cz, complaintId } = await setup();
    stubPush(400, { message: 'bad request' });
    const row = await enqueueRow({ citizenId: cz, complaintId, attempt: 0, key: `w:nr:${complaintId}` });

    expect(await job.processRow(row)).toBe('failed');
    expect((await rowAfter(row.id)).status).toBe('failed');
  });
});
