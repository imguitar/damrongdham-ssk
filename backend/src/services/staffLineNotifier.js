'use strict';

const pool = require('../config/database');
const outboxSvc = require('./notificationOutboxService');

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

// เรื่องร้องเรียนใหม่เข้าระบบ → กลุ่มศูนย์
const notifyNewComplaint = (complaintId) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const groups = await centerGroups('notify_new');
  await enqueueGroups(groups, {
    eventType: 'STAFF_NEW_COMPLAINT', complaintId,
    payload: { complaintId, complaintNumber: c.complaint_number, category: c.category },
    keySuffix: `staff:new:${complaintId}`,
  });
});

// ส่งต่อหน่วยงาน → กลุ่มหน่วยงานปลายทาง
const notifyForwarded = (complaintId, agencyId) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const groups = await agencyGroups(agencyId, 'notify_forwarded');
  await enqueueGroups(groups, {
    eventType: 'STAFF_FORWARDED', complaintId,
    payload: { complaintId, complaintNumber: c.complaint_number, category: c.category, dueDate: fmtDate(c.due_date), agencyName: await agencyName(agencyId) },
    keySuffix: `staff:fwd:${complaintId}:ag${agencyId}`,
  });
});

// ใกล้/เกินกำหนด → กลุ่มหน่วยงานผู้รับผิดชอบ. kind: 'due' | 'overdue'
const notifySla = (complaintId, kind) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const agencyId = await activeAgencyId(complaintId);
  const groups = await agencyGroups(agencyId, 'notify_sla');
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  await enqueueGroups(groups, {
    eventType: kind === 'overdue' ? 'STAFF_SLA_OVERDUE' : 'STAFF_SLA_DUE', complaintId,
    payload: { complaintId, complaintNumber: c.complaint_number, dueDate: fmtDate(c.due_date) },
    keySuffix: `staff:sla:${kind}:${complaintId}:${day}`,
  });
});

// Escalation L1/L2/L3 → กลุ่มหน่วยงาน + ศูนย์
const notifyEscalation = (complaintId, agencyId, level) => safe(async () => {
  const c = await complaintSummary(complaintId);
  if (!c) return;
  const groups = [
    ...(await agencyGroups(agencyId, 'notify_escalation')),
    ...(await centerGroups('notify_escalation')),
  ];
  await enqueueGroups(groups, {
    eventType: 'STAFF_ESCALATION', complaintId,
    payload: { complaintId, complaintNumber: c.complaint_number, level },
    keySuffix: `staff:esc:L${level}:${complaintId}`,
  });
});

module.exports = { notifyNewComplaint, notifyForwarded, notifySla, notifyEscalation };
