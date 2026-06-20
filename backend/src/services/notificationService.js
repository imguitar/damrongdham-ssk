'use strict';

const pool = require('../config/database');
const notifModel = require('../models/notificationModel');

const NOTIFICATION_TEMPLATES = {
  WORKFLOW_ASSIGNED:  { title: 'มอบหมายเรื่องใหม่',          message: (n) => `เรื่องร้องเรียน ${n} ได้รับการมอบหมายให้หน่วยงานของคุณดำเนินการ` },
  WORKFLOW_ACCEPTED:  { title: 'หน่วยงานรับเรื่องแล้ว',       message: (n) => `เรื่องร้องเรียน ${n} ได้รับการยืนยันรับเรื่องจากหน่วยงาน` },
  WORKFLOW_RETURNED:  { title: 'หน่วยงานส่งคืนเรื่อง',        message: (n) => `เรื่องร้องเรียน ${n} ถูกส่งคืนจากหน่วยงาน กรุณาตรวจสอบ` },
  WORKFLOW_STARTED:   { title: 'หน่วยงานเริ่มดำเนินการ',      message: (n) => `เรื่องร้องเรียน ${n} อยู่ระหว่างดำเนินการโดยหน่วยงาน` },
  WORKFLOW_RESOLVED:  { title: 'หน่วยงานส่งผลดำเนินการ',      message: (n) => `เรื่องร้องเรียน ${n} ส่งผลดำเนินการแล้ว กรุณาตรวจสอบ` },
  WORKFLOW_REVIEWING: { title: 'ศูนย์ตรวจสอบผลงาน',           message: (n) => `เรื่องร้องเรียน ${n} อยู่ระหว่างการตรวจสอบผลโดยศูนย์` },
  WORKFLOW_CLOSED:    { title: 'ปิดเรื่องร้องเรียนแล้ว',       message: (n) => `เรื่องร้องเรียน ${n} ได้รับการปิดเรื่องเรียบร้อยแล้ว` },
  WORKFLOW_SENT_BACK: { title: 'ส่งคืนเพื่อแก้ไขผล',          message: (n) => `เรื่องร้องเรียน ${n} ถูกส่งคืนเพื่อแก้ไขผลดำเนินการ` },
  SLA_OVERDUE:        { title: 'เรื่องเกินกำหนด',              message: (n) => `เรื่องร้องเรียน ${n} เกินกำหนดดำเนินการแล้ว กรุณาเร่งรัด` },
  SLA_NEAR_DUE:       { title: 'ใกล้ครบกำหนด (3 วัน)',         message: (n) => `เรื่องร้องเรียน ${n} จะครบกำหนดในอีก 3 วัน` },
  ESCALATION_L1:      { title: 'เร่งรัด: ไม่มีการอัปเดต 30 วัน', message: (n) => `เรื่องร้องเรียน ${n} ไม่มีการอัปเดตความคืบหน้าเกิน 30 วัน` },
  ESCALATION_L2:      { title: 'เร่งรัด: ไม่มีการอัปเดต 45 วัน', message: (n) => `เรื่องร้องเรียน ${n} ไม่มีการอัปเดตความคืบหน้าเกิน 45 วัน` },
  ESCALATION_L3:      { title: 'เร่งรัดสูงสุด: ไม่มีการอัปเดต 52 วัน', message: (n) => `เรื่องร้องเรียน ${n} ไม่มีการอัปเดตความคืบหน้าเกิน 52 วัน กรุณาดำเนินการเร่งด่วน` },
};

// center actions → notify agency; agency actions → notify center
const ACTION_MAP = {
  assign:   { type: 'WORKFLOW_ASSIGNED',   target: 'agency' },
  review:   { type: 'WORKFLOW_REVIEWING',  target: 'agency' },
  close:    { type: 'WORKFLOW_CLOSED',     target: 'agency' },
  sendBack: { type: 'WORKFLOW_SENT_BACK',  target: 'agency' },
  accept:   { type: 'WORKFLOW_ACCEPTED',   target: 'center' },
  return:   { type: 'WORKFLOW_RETURNED',   target: 'center' },
  start:    { type: 'WORKFLOW_STARTED',    target: 'center' },
  resolve:  { type: 'WORKFLOW_RESOLVED',   target: 'center' },
};

const getCenterUserIds = async () => {
  const [rows] = await pool.query(
    `SELECT u.id FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE r.code IN ('super_admin','admin','officer','chief') AND u.is_active = 1`
  );
  return rows.map((r) => r.id);
};

const getAgencyUserIds = async (agencyId) => {
  const [rows] = await pool.query(
    `SELECT u.id FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.agency_id = ? AND r.code IN ('agency_officer','agency_head') AND u.is_active = 1`,
    [agencyId]
  );
  return rows.map((r) => r.id);
};

const getAgencyHeadIds = async (agencyId) => {
  const [rows] = await pool.query(
    `SELECT u.id FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.agency_id = ? AND r.code = 'agency_head' AND u.is_active = 1`,
    [agencyId]
  );
  return rows.map((r) => r.id);
};

const getActiveAgencyId = async (complaintId) => {
  const [[row]] = await pool.query(
    'SELECT agency_id FROM complaint_assignments WHERE complaint_id = ? AND is_active = 1 LIMIT 1',
    [complaintId]
  );
  return row?.agency_id || null;
};

const createForCenterUsers = async ({ complaintId, type, title, message }) => {
  const userIds = await getCenterUserIds();
  if (!userIds.length) return;
  await notifModel.createBatch(userIds.map((userId) => ({ userId, complaintId, type, title, message })));
};

const createForAgencyUsers = async (agencyId, { complaintId, type, title, message }) => {
  const userIds = await getAgencyUserIds(agencyId);
  if (!userIds.length) return;
  await notifModel.createBatch(userIds.map((userId) => ({ userId, complaintId, type, title, message })));
};

const createForAgencyHeads = async (agencyId, { complaintId, type, title, message }) => {
  const userIds = await getAgencyHeadIds(agencyId);
  if (!userIds.length) return;
  await notifModel.createBatch(userIds.map((userId) => ({ userId, complaintId, type, title, message })));
};

// Fire-and-forget — called after a transaction commits; never throws
const notifyWorkflow = async (complaintId, action, { complaint_number, agencyId } = {}) => {
  try {
    const mapping = ACTION_MAP[action];
    if (!mapping) return;
    const tpl = NOTIFICATION_TEMPLATES[mapping.type];
    if (!tpl) return;

    const notifData = {
      complaintId,
      type:    mapping.type,
      title:   tpl.title,
      message: tpl.message(complaint_number || `#${complaintId}`),
    };

    if (mapping.target === 'center') {
      await createForCenterUsers(notifData);
    } else {
      const aid = agencyId || (await getActiveAgencyId(complaintId));
      if (aid) await createForAgencyUsers(aid, notifData);
    }
  } catch (err) {
    console.error('[NotificationService] notifyWorkflow error:', err.message);
  }
};

module.exports = {
  NOTIFICATION_TEMPLATES,
  getCenterUserIds,
  getAgencyUserIds,
  getAgencyHeadIds,
  getActiveAgencyId,
  createForCenterUsers,
  createForAgencyUsers,
  createForAgencyHeads,
  notifyWorkflow,
};
