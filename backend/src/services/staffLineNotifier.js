'use strict';

const pool = require('../config/database');
const outboxSvc = require('./notificationOutboxService');
const notifSvc = require('./notificationService');

// Wrap every trigger so a LINE issue never breaks the caller (fire-and-forget)
const safe = (fn) => fn().catch((err) => console.error('[StaffLineNotifier]', err.message));

const complaintSummary = async (complaintId) => {
  const [[c]] = await pool.query(
    `SELECT c.id, c.complaint_number, c.due_date, c.escalation_level, cat.name AS category
     FROM complaints c
     LEFT JOIN complaint_categories cat ON cat.id = c.category_id
     WHERE c.id = ?`,
    [complaintId]
  );
  return c || null;
};

const activeAgencyId = async (complaintId) => {
  const [[row]] = await pool.query(
    'SELECT agency_id FROM complaint_assignments WHERE complaint_id = ? AND is_active = 1 LIMIT 1',
    [complaintId]
  );
  return row?.agency_id || null;
};

// flag column names are hard-coded constants (never user input)
const centerGroups = async (flag) => {
  const [rows] = await pool.query(
    `SELECT group_id FROM line_group_targets WHERE scope='center' AND is_active=1 AND ${flag}=1`
  );
  return rows.map((r) => r.group_id);
};
const agencyGroups = async (agencyId, flag) => {
  if (!agencyId) return [];
  const [rows] = await pool.query(
    `SELECT group_id FROM line_group_targets WHERE scope='agency' AND agency_id=? AND is_active=1 AND ${flag}=1`,
    [agencyId]
  );
  return rows.map((r) => r.group_id);
};
const agencyName = async (agencyId) => {
  if (!agencyId) return null;
  const [[a]] = await pool.query('SELECT name FROM agencies WHERE id = ?', [agencyId]);
  return a?.name || null;
};

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

const enqueueGroups = async (groupIds, { eventType, complaintId, payload, keySuffix }) => {
  for (const groupId of groupIds) {
    await outboxSvc.enqueueGroup(null, {
      eventType, groupId, complaintId, payload,
      idempotencyKey: `${keySuffix}:group:${groupId}`,
    });
  }
};

// among the given staff userIds, keep those with a LINE link + the event enabled
// (missing preference row → default ON, mirrors citizen behaviour)
const linkedOptedInUsers = async (userIds, flag) => {
  if (!userIds.length) return [];
  const ph = userIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT ui.user_id
     FROM user_identities ui
     LEFT JOIN user_notification_preferences p ON p.user_id = ui.user_id
     WHERE ui.provider = 'line' AND ui.user_id IN (${ph})
       AND COALESCE(p.line_enabled, 1) = 1 AND COALESCE(p.${flag}, 1) = 1`,
    userIds
  );
  return rows.map((r) => r.user_id);
};

const enqueueUsers = async (userIds, { eventType, complaintId, payload, keySuffix }) => {
  for (const userId of userIds) {
    await outboxSvc.enqueueUser(null, {
      eventType, userId, complaintId, payload,
      idempotencyKey: `${keySuffix}:user:${userId}`,
    });
  }
};

// เรื่องร้องเรียนใหม่เข้าระบบ → กลุ่มศูนย์ + DM เจ้าหน้าที่ศูนย์
const notifyNewComplaint = (complaintId) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const payload = { complaintId, complaintNumber: c.complaint_number, category: c.category };
  const key = `staff:new:${complaintId}`;
  await enqueueGroups(await centerGroups('notify_new'), { eventType: 'STAFF_NEW_COMPLAINT', complaintId, payload, keySuffix: key });
  const users = await linkedOptedInUsers(await notifSvc.getCenterUserIds(), 'notify_new');
  await enqueueUsers(users, { eventType: 'STAFF_NEW_COMPLAINT', complaintId, payload, keySuffix: key });
});

// ส่งต่อหน่วยงาน → กลุ่มหน่วยงานปลายทาง + DM เจ้าหน้าที่หน่วยงานนั้น
const notifyForwarded = (complaintId, agencyId) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const payload = { complaintId, complaintNumber: c.complaint_number, category: c.category, dueDate: fmtDate(c.due_date), agencyName: await agencyName(agencyId) };
  const key = `staff:fwd:${complaintId}:ag${agencyId}`;
  await enqueueGroups(await agencyGroups(agencyId, 'notify_forwarded'), { eventType: 'STAFF_FORWARDED', complaintId, payload, keySuffix: key });
  const users = await linkedOptedInUsers(await notifSvc.getAgencyUserIds(agencyId), 'notify_forwarded');
  await enqueueUsers(users, { eventType: 'STAFF_FORWARDED', complaintId, payload, keySuffix: key });
});

// ใกล้/เกินกำหนด → กลุ่มหน่วยงานผู้รับผิดชอบ + DM. kind: 'due' | 'overdue'
const notifySla = (complaintId, kind) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const agencyId = await activeAgencyId(complaintId);
  const payload = { complaintId, complaintNumber: c.complaint_number, dueDate: fmtDate(c.due_date) };
  const eventType = kind === 'overdue' ? 'STAFF_SLA_OVERDUE' : 'STAFF_SLA_DUE';
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `staff:sla:${kind}:${complaintId}:${day}`;
  await enqueueGroups(await agencyGroups(agencyId, 'notify_sla'), { eventType, complaintId, payload, keySuffix: key });
  const users = await linkedOptedInUsers(await notifSvc.getAgencyUserIds(agencyId), 'notify_sla');
  await enqueueUsers(users, { eventType, complaintId, payload, keySuffix: key });
});

// Escalation L1/L2/L3 → กลุ่มหน่วยงาน + ศูนย์ + DM
const notifyEscalation = (complaintId, agencyId, level) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const payload = { complaintId, complaintNumber: c.complaint_number, level };
  const key = `staff:esc:L${level}:${complaintId}`;
  const groups = [...(await agencyGroups(agencyId, 'notify_escalation')), ...(await centerGroups('notify_escalation'))];
  await enqueueGroups(groups, { eventType: 'STAFF_ESCALATION', complaintId, payload, keySuffix: key });
  const candidateUsers = [...(await notifSvc.getAgencyUserIds(agencyId)), ...(await notifSvc.getCenterUserIds())];
  const users = await linkedOptedInUsers(candidateUsers, 'notify_escalation');
  await enqueueUsers(users, { eventType: 'STAFF_ESCALATION', complaintId, payload, keySuffix: key });
});

module.exports = { notifyNewComplaint, notifyForwarded, notifySla, notifyEscalation };
