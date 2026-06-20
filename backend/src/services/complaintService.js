'use strict';

const pool = require('../config/database');
const { calculateDueDate } = require('./slaService');
const notifSvc = require('./notificationService');

const CENTER_ROLES = ['super_admin', 'admin', 'officer', 'chief'];
const AGENCY_ROLES = ['agency_officer', 'agency_head'];

// T-01 to T-12 from 04-complaint-workflow.md
const TRANSITION_MAP = {
  NEW:         { screen:    { to: 'SCREENING',   roles: CENTER_ROLES } },
  SCREENING:   {
    assign:    { to: 'ASSIGNED',    roles: CENTER_ROLES },
    reject:    { to: 'REJECTED',    roles: CENTER_ROLES },
  },
  ASSIGNED:    {
    accept:    { to: 'ACCEPTED',    roles: AGENCY_ROLES },
    return:    { to: 'RETURNED',    roles: AGENCY_ROLES },
  },
  ACCEPTED:    {
    start:     { to: 'IN_PROGRESS', roles: AGENCY_ROLES },
    return:    { to: 'RETURNED',    roles: AGENCY_ROLES },
  },
  IN_PROGRESS: { resolve:   { to: 'RESOLVED',    roles: AGENCY_ROLES } },
  RESOLVED:    { review:    { to: 'REVIEWING',   roles: CENTER_ROLES } },
  REVIEWING:   {
    close:     { to: 'CLOSED',      roles: CENTER_ROLES },
    sendBack:  { to: 'IN_PROGRESS', roles: CENTER_ROLES },
  },
  RETURNED:    { screen:    { to: 'SCREENING',   roles: CENTER_ROLES } },
};

const validateTransition = (currentStatus, action, role) => {
  const statusMap = TRANSITION_MAP[currentStatus];
  if (!statusMap) return { valid: false, message: `สถานะ ${currentStatus} ไม่อนุญาตให้เปลี่ยนสถานะ` };
  const transition = statusMap[action];
  if (!transition) return { valid: false, message: `ไม่สามารถดำเนินการ "${action}" เมื่อสถานะเป็น ${currentStatus}` };
  if (!transition.roles.includes(role)) return { valid: false, message: `บทบาท "${role}" ไม่มีสิทธิ์ดำเนินการนี้` };
  return { valid: true, to: transition.to };
};

// Update complaint status + write status log — must be called inside an open transaction
const changeStatus = async (conn, complaintId, fromStatus, toStatus, changedBy, note, extraFields = {}) => {
  const setClauses = ['status = ?', 'updated_at = NOW()'];
  const values = [toStatus];
  for (const [col, val] of Object.entries(extraFields)) {
    setClauses.push(`${col} = ?`);
    values.push(val);
  }
  values.push(complaintId);
  await conn.query(`UPDATE complaints SET ${setClauses.join(', ')} WHERE id = ?`, values);
  await conn.query(
    `INSERT INTO complaint_status_logs (complaint_id, from_status, to_status, changed_by, note, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [complaintId, fromStatus, toStatus, changedBy, note || null]
  );
};

// For center-only transitions (screen, reject, review, close, sendBack) — handles own transaction
const executeTransition = async (complaintId, action, userId, role, options = {}) => {
  const [[complaint]] = await pool.query('SELECT id, status, category_id, complaint_number FROM complaints WHERE id = ?', [complaintId]);
  if (!complaint) throw Object.assign(new Error('ไม่พบเรื่องร้องเรียน'), { statusCode: 404, code: 'NOT_FOUND' });

  const { valid, to, message } = validateTransition(complaint.status, action, role);
  if (!valid) throw Object.assign(new Error(message), { statusCode: 400, code: 'INVALID_TRANSITION' });

  const extraFields = {};
  if (action === 'reject') {
    if (!options.rejectionReason) throw Object.assign(new Error('กรุณาระบุเหตุผลการปฏิเสธ'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    extraFields.rejection_reason = options.rejectionReason;
  }
  if (action === 'close') {
    if (!options.closedSummary) throw Object.assign(new Error('กรุณาระบุสรุปผลการดำเนินงาน'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    extraFields.closed_summary = options.closedSummary;
    extraFields.closed_at = new Date();
    extraFields.closed_by = userId;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await changeStatus(conn, complaintId, complaint.status, to, userId, options.note || null, extraFields);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notify after commit — fire and forget (only for transitions that affect other parties)
  if (['review', 'close', 'sendBack'].includes(action)) {
    notifSvc.notifyWorkflow(complaintId, action, { complaint_number: complaint.complaint_number });
  }

  return to;
};

// Assign: creates complaint_assignment record + transitions SCREENING → ASSIGNED
const executeAssign = async (complaint, userId, role, { agencyId, note } = {}) => {
  const { valid, to, message } = validateTransition(complaint.status, 'assign', role);
  if (!valid) throw Object.assign(new Error(message), { statusCode: 400, code: 'INVALID_TRANSITION' });

  let slaDays = 15;
  if (complaint.category_id) {
    const [[cat]] = await pool.query('SELECT sla_days FROM complaint_categories WHERE id = ?', [complaint.category_id]);
    if (cat) slaDays = cat.sla_days;
  }
  const dueDate = calculateDueDate(slaDays);

  const conn = await pool.getConnection();
  let assignmentId;
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE complaint_assignments SET is_active = 0 WHERE complaint_id = ? AND is_active = 1',
      [complaint.id]
    );

    const [result] = await conn.query(
      `INSERT INTO complaint_assignments
         (complaint_id, agency_id, assigned_by, assigned_at, due_date, status, note, is_active, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), ?, 'PENDING', ?, 1, NOW(), NOW())`,
      [complaint.id, agencyId, userId, dueDate, note || null]
    );
    assignmentId = result.insertId;

    await changeStatus(conn, complaint.id, complaint.status, to, userId, note || null, { due_date: dueDate });
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  // Notify agency after assign commit — fire and forget
  notifSvc.notifyWorkflow(complaint.id, 'assign', {
    complaint_number: complaint.complaint_number,
    agencyId,
  });

  return { to, dueDate, assignmentId };
};

module.exports = {
  CENTER_ROLES, AGENCY_ROLES, TRANSITION_MAP,
  validateTransition, changeStatus,
  executeTransition, executeAssign,
};
