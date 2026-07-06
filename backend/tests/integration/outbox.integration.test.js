import { describe, it, expect, afterEach } from 'vitest';
import complaintSvc from '../../src/services/complaintService.js';
import outboxSvc from '../../src/services/notificationOutboxService.js';
import {
  pool, dbAvailable, refs, createCitizen, createComplaint, getOutbox, cleanupComplaint, cleanupCitizen,
} from './_helpers.js';

const DB = await dbAvailable();
const cComplaints = [];
const cCitizens = [];

(DB ? describe : describe.skip)('notification outbox on complaint changes (DB)', () => {
  afterEach(async () => {
    while (cComplaints.length) await cleanupComplaint(cComplaints.pop());
    while (cCitizens.length) await cleanupCitizen(cCitizens.pop());
  });

  it('status change writes status log + outbox row in the same commit', async () => {
    const cz = await createCitizen({ lineSub: `Uob_${Date.now()}` }); cCitizens.push(cz);
    const { id, number } = await createComplaint({ citizenId: cz, status: 'NEW' });
    const { userId } = await refs();

    await complaintSvc.executeTransition(id, 'screen', userId, 'admin');

    const [[log]] = await pool.query('SELECT to_status FROM complaint_status_logs WHERE complaint_id=?', [id]);
    expect(log.to_status).toBe('SCREENING');

    const ob = await getOutbox(id);
    expect(ob).toHaveLength(1);
    expect(ob[0].event_type).toBe('COMPLAINT_STATUS_CHANGED');
    expect(ob[0].status).toBe('pending');
    const payload = typeof ob[0].payload === 'string' ? JSON.parse(ob[0].payload) : ob[0].payload;
    expect(payload.status).toBe('SCREENING');
    expect(payload.complaintNumber).toBe(number);
  });

  it('maps CLOSED to COMPLAINT_CLOSED', async () => {
    const cz = await createCitizen({ lineSub: `Uob2_${Date.now()}` }); cCitizens.push(cz);
    const { id } = await createComplaint({ citizenId: cz, status: 'SCREENING' });
    const { userId } = await refs();

    const conn = await pool.getConnection();
    await conn.beginTransaction();
    await complaintSvc.changeStatus(conn, id, 'SCREENING', 'CLOSED', userId, 'done', { closed_summary: 'x' });
    await conn.commit(); conn.release();

    const ob = await getOutbox(id);
    expect(ob.some((r) => r.event_type === 'COMPLAINT_CLOSED')).toBe(true);
  });

  it('does NOT enqueue for complaints without a citizen owner', async () => {
    const { id } = await createComplaint({ citizenId: null, status: 'NEW' }); cComplaints.push(id);
    const { userId } = await refs();
    await complaintSvc.executeTransition(id, 'screen', userId, 'admin');
    expect(await getOutbox(id)).toHaveLength(0);
  });

  it('is idempotent on the same idempotency_key', async () => {
    const cz = await createCitizen(); cCitizens.push(cz);
    const { id } = await createComplaint({ citizenId: cz }); cComplaints.push(id);
    const key = `itest:${id}:dup`;
    await outboxSvc.enqueue(null, { eventType: 'COMPLAINT_STATUS_CHANGED', citizenId: cz, complaintId: id, complaintNumber: 'X', status: 'NEW', idempotencyKey: key });
    await outboxSvc.enqueue(null, { eventType: 'COMPLAINT_STATUS_CHANGED', citizenId: cz, complaintId: id, complaintNumber: 'X', status: 'NEW', idempotencyKey: key });
    expect(await getOutbox(id)).toHaveLength(1);
  });
});
