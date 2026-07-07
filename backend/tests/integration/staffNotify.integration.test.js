import { describe, it, expect, afterEach, vi } from 'vitest';
import staff from '../../src/services/staffLineNotifier.js';
import job from '../../src/jobs/notificationOutboxJob.js';
import gm from '../../src/models/lineGroupModel.js';
import tpl from '../../src/utils/lineMessageTemplate.js';
import { pool, dbAvailable, refs, createComplaint, cleanupComplaint } from './_helpers.js';

const DB = await dbAvailable();
const groupsToClean = [];
const complaintsToClean = [];

const bindGroup = async (scope, agencyId) => {
  const groupId = `Gt_${scope}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const { userId } = await refs();
  await gm.upsertTarget({ scope, agencyId, groupId, label: 'itest', boundBy: userId });
  groupsToClean.push(groupId);
  return groupId;
};
const outboxFor = async (complaintId, eventType) => {
  const [rows] = await pool.query(
    'SELECT * FROM notification_outbox WHERE complaint_id=? AND event_type=?', [complaintId, eventType]);
  return rows;
};

(DB ? describe : describe.skip)('staff LINE group notifications (DB)', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (complaintsToClean.length) await cleanupComplaint(complaintsToClean.pop());
    while (groupsToClean.length) await pool.query('DELETE FROM line_group_targets WHERE group_id=?', [groupsToClean.pop()]);
  });

  // NOTE: assertions target the specific bound group (not total counts), because
  // the shared test DB may hold other active groups for the same unit in parallel runs.
  const rowForGroup = async (complaintId, eventType, groupId) => {
    const [[row]] = await pool.query(
      'SELECT * FROM notification_outbox WHERE complaint_id=? AND event_type=? AND line_group_id=?',
      [complaintId, eventType, groupId]);
    return row || null;
  };

  it('new complaint enqueues STAFF_NEW_COMPLAINT to a center group', async () => {
    const center = await bindGroup('center', null);
    const { id } = await createComplaint({ status: 'NEW' }); complaintsToClean.push(id);

    await staff.notifyNewComplaint(id);
    const row = await rowForGroup(id, 'STAFF_NEW_COMPLAINT', center);
    expect(row).toBeTruthy();
    expect(row.recipient_type).toBe('line_group');
    expect(row.citizen_id).toBeNull();
  });

  it('forwarded notifies the agency group but not the center group', async () => {
    const [[ag]] = await pool.query('SELECT id FROM agencies WHERE is_center=0 AND is_active=1 LIMIT 1');
    const centerGroup = await bindGroup('center', null);
    const agencyGroup = await bindGroup('agency', ag.id);
    const { id } = await createComplaint({ status: 'SCREENING' }); complaintsToClean.push(id);

    await staff.notifyForwarded(id, ag.id);
    expect(await rowForGroup(id, 'STAFF_FORWARDED', agencyGroup)).toBeTruthy();
    expect(await rowForGroup(id, 'STAFF_FORWARDED', centerGroup)).toBeNull(); // center excluded
  });

  it('worker delivers a group row and logs it as line_group', async () => {
    const center = await bindGroup('center', null);
    const { id } = await createComplaint({ status: 'NEW' }); complaintsToClean.push(id);
    await staff.notifyNewComplaint(id);
    const row = await rowForGroup(id, 'STAFF_NEW_COMPLAINT', center);

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ sentMessages: [{ id: 'GMID' }] }) })));
    expect(await job.processRow(row)).toBe('sent');

    const [[log]] = await pool.query('SELECT recipient_type, line_group_id, status FROM notification_logs WHERE outbox_id=?', [row.id]);
    expect(log.recipient_type).toBe('line_group');
    expect(log.line_group_id).toBe(center);
    expect(log.status).toBe('sent');
  });

  it('worker cancels a group row when the target is inactive', async () => {
    const center = await bindGroup('center', null);
    const { id } = await createComplaint({ status: 'NEW' }); complaintsToClean.push(id);
    await staff.notifyNewComplaint(id);
    const row = await rowForGroup(id, 'STAFF_NEW_COMPLAINT', center);

    await pool.query('UPDATE line_group_targets SET is_active=0 WHERE group_id=?', [center]);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
    expect(await job.processRow(row)).toBe('cancelled');
    const [[after]] = await pool.query('SELECT status, last_error FROM notification_outbox WHERE id=?', [row.id]);
    expect(after.status).toBe('cancelled');
    expect(after.last_error).toBe('group_inactive');
  });

  it('staff template is privacy-safe (no citizen PII), has reference + staff link', () => {
    const msg = tpl.buildStaffByEvent('STAFF_FORWARDED', { complaintId: 42, complaintNumber: 'SSK-1', category: 'ถนน', dueDate: '2026-08-01' });
    expect(msg).toContain('SSK-1');
    expect(msg).toContain('/complaints/42');
    for (const forbidden of ['บัตรประชาชน', 'id_card', 'ผู้ร้อง']) expect(msg).not.toContain(forbidden);
  });
});
