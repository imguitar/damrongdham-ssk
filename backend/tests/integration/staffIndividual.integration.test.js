import { describe, it, expect, afterEach, vi } from 'vitest';
import idsvc from '../../src/services/identityService.js';
import staff from '../../src/services/staffLineNotifier.js';
import job from '../../src/jobs/notificationOutboxJob.js';
import { pool, dbAvailable, createStaffUser, cleanupUser, createComplaint, cleanupComplaint } from './_helpers.js';

const DB = await dbAvailable();
const users = [];
const complaints = [];
const track = (id) => { users.push(id); return id; };

const linkStaff = async (userId, sub) => idsvc.linkLineToUser({ userId, sub, displayName: 'จนท' });
const userOutbox = async (complaintId, userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM notification_outbox WHERE complaint_id=? AND recipient_type="user" AND recipient_user_id=?',
    [complaintId, userId]);
  return rows;
};

(DB ? describe : describe.skip)('staff individual LINE link + DM (DB)', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (complaints.length) await cleanupComplaint(complaints.pop());
    while (users.length) await cleanupUser(users.pop());
  });

  it('links, is idempotent, and guards conflicts', async () => {
    const a = track(await createStaffUser({ roleId: 1 }));
    const b = track(await createStaffUser({ roleId: 1 }));
    const sub = `Us_${Date.now()}`;

    expect((await linkStaff(a, sub)).linked).toBe(true);
    expect((await linkStaff(a, sub)).already).toBe(true); // idempotent
    await expect(linkStaff(b, sub)).rejects.toMatchObject({ code: 'LINE_IDENTITY_CONFLICT' });
    await expect(linkStaff(a, `Us_other_${Date.now()}`)).rejects.toMatchObject({ code: 'LINE_ALREADY_LINKED' });

    expect(await idsvc.getUserLineIdentity(a)).toBeTruthy();
    expect(await idsvc.unlinkLineUser(a)).toBe(true);
    expect(await idsvc.getUserLineIdentity(a)).toBeFalsy();
  });

  it('enqueues a DM to a linked, opted-in center staff on a new complaint', async () => {
    const u = track(await createStaffUser({ roleId: 1 })); // center role
    await linkStaff(u, `Us_dm_${Date.now()}`);
    const { id } = await createComplaint({ status: 'NEW' }); complaints.push(id);

    await staff.notifyNewComplaint(id);
    const rows = await userOutbox(id, u);
    expect(rows).toHaveLength(1);
    expect(rows[0].event_type).toBe('STAFF_NEW_COMPLAINT');
    expect(rows[0].citizen_id).toBeNull();
  });

  it('does NOT DM a staff member who disabled the event', async () => {
    const u = track(await createStaffUser({ roleId: 1 }));
    await linkStaff(u, `Us_off_${Date.now()}`);
    await pool.query('UPDATE user_notification_preferences SET notify_new=0 WHERE user_id=?', [u]);
    const { id } = await createComplaint({ status: 'NEW' }); complaints.push(id);

    await staff.notifyNewComplaint(id);
    expect(await userOutbox(id, u)).toHaveLength(0);
  });

  it('does NOT DM a staff member who never linked LINE', async () => {
    const u = track(await createStaffUser({ roleId: 1 })); // no identity
    const { id } = await createComplaint({ status: 'NEW' }); complaints.push(id);
    await staff.notifyNewComplaint(id);
    expect(await userOutbox(id, u)).toHaveLength(0);
  });

  it('worker delivers a DM row and logs it as recipient_type user', async () => {
    const u = track(await createStaffUser({ roleId: 1 }));
    await linkStaff(u, `Us_wk_${Date.now()}`);
    const { id } = await createComplaint({ status: 'NEW' }); complaints.push(id);
    await staff.notifyNewComplaint(id);
    const [row] = await userOutbox(id, u);

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ sentMessages: [{ id: 'UMID' }] }) })));
    expect(await job.processRow(row)).toBe('sent');
    const [[log]] = await pool.query('SELECT recipient_type, recipient_user_id, status FROM notification_logs WHERE outbox_id=?', [row.id]);
    expect(log.recipient_type).toBe('user');
    expect(log.recipient_user_id).toBe(u);
    expect(log.status).toBe('sent');
  });
});
