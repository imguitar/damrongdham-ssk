'use strict';

const { config } = require('../config/line');

// Citizen-facing status labels — privacy-safe, no internal detail / no PII.
// Keep separate from staff-facing workflow labels (these are what the public sees).
const STATUS_LABELS = {
  NEW:         'รับเรื่องเข้าระบบแล้ว',
  SCREENING:   'อยู่ระหว่างคัดกรองเรื่อง',
  ASSIGNED:    'ส่งต่อหน่วยงานที่รับผิดชอบแล้ว',
  ACCEPTED:    'หน่วยงานรับเรื่องแล้ว',
  IN_PROGRESS: 'อยู่ระหว่างดำเนินการ',
  RESOLVED:    'ดำเนินการเสร็จ รอตรวจสอบผล',
  REVIEWING:   'อยู่ระหว่างตรวจสอบผล',
  RETURNED:    'ส่งคืนเพื่อพิจารณาใหม่',
  CLOSED:      'ดำเนินการเสร็จสิ้น (ปิดเรื่อง)',
  REJECTED:    'ไม่รับพิจารณาเรื่อง',
};

const statusLabel = (status) => STATUS_LABELS[status] || status;

// Deep link — the page enforces auth + ownership again (never trust URL alone)
const detailUrl = (complaintNumber) =>
  `${config.frontendUrl}/citizen/complaints/${encodeURIComponent(complaintNumber)}`;

const footer = (complaintNumber) => `\n\nดูรายละเอียด:\n${detailUrl(complaintNumber)}`;

// IMPORTANT (§18): never include ID card, health data, accused names, full
// allegations, attachments, or internal notes — only reference number + status.
const buildComplaintStatusMessage = ({ complaintNumber, status }) =>
  `🔔 แจ้งความคืบหน้าเรื่องร้องเรียน\n\nเลขที่เรื่อง: ${complaintNumber}\nสถานะใหม่:\n${statusLabel(status)}` +
  footer(complaintNumber);

const buildComplaintProgressMessage = ({ complaintNumber }) =>
  `🔔 มีความคืบหน้าใหม่\n\nเลขที่เรื่อง: ${complaintNumber}\nเจ้าหน้าที่ได้อัปเดตความคืบหน้าของเรื่องท่านแล้ว` +
  footer(complaintNumber);

const buildComplaintMoreInfoMessage = ({ complaintNumber }) =>
  `🔔 ขอข้อมูลเพิ่มเติม\n\nเลขที่เรื่อง: ${complaintNumber}\nเจ้าหน้าที่ขอข้อมูลเพิ่มเติมเพื่อดำเนินการต่อ กรุณาเข้าสู่ระบบเพื่อดูรายละเอียด` +
  footer(complaintNumber);

const buildComplaintResolvedMessage = ({ complaintNumber }) =>
  `🔔 ดำเนินการเสร็จสิ้น\n\nเลขที่เรื่อง: ${complaintNumber}\nเรื่องของท่านได้ดำเนินการเสร็จแล้ว` +
  footer(complaintNumber);

const buildComplaintClosedMessage = ({ complaintNumber }) =>
  `🔔 ปิดเรื่องร้องเรียน\n\nเลขที่เรื่อง: ${complaintNumber}\nเรื่องของท่านได้รับการปิดเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ` +
  footer(complaintNumber);

// ── Staff (group) messages ────────────────────────────────────────────────────
// Internal — may include reference/category/agency/due, but NEVER citizen PII
// (name / id card), because staff groups can contain people outside the team.
const staffDetailUrl = (complaintId) => `${config.frontendUrl}/complaints/${complaintId}`;
const staffFooter = (complaintId) =>
  complaintId ? `\n\nดูรายละเอียด (เจ้าหน้าที่):\n${staffDetailUrl(complaintId)}` : '';

const line = (label, val) => (val ? `\n${label}: ${val}` : '');

const buildStaffByEvent = (eventType, d = {}) => {
  const num = d.complaintNumber || '-';
  const foot = staffFooter(d.complaintId);
  switch (eventType) {
    case 'STAFF_NEW_COMPLAINT':
      return `📥 เรื่องร้องเรียนใหม่\n\nเลขที่เรื่อง: ${num}${line('ประเภท', d.category)}\nกรุณาตรวจสอบและคัดกรอง` + foot;
    case 'STAFF_FORWARDED':
      return `📨 มีเรื่องส่งมายังหน่วยงานของท่าน\n\nเลขที่เรื่อง: ${num}${line('ประเภท', d.category)}${line('กำหนดแล้วเสร็จ', d.dueDate)}\nกรุณารับเรื่องและดำเนินการ` + foot;
    case 'STAFF_SLA_DUE':
      return `⏰ ใกล้ครบกำหนด (อีก 3 วัน)\n\nเลขที่เรื่อง: ${num}${line('กำหนดแล้วเสร็จ', d.dueDate)}` + foot;
    case 'STAFF_SLA_OVERDUE':
      return `🚨 เกินกำหนดดำเนินการ\n\nเลขที่เรื่อง: ${num}${line('กำหนดแล้วเสร็จ', d.dueDate)}\nกรุณาเร่งรัดดำเนินการ` + foot;
    case 'STAFF_ESCALATION':
      return `🔺 เร่งรัด (ระดับ ${d.level || '-'})\n\nเลขที่เรื่อง: ${num}\nไม่มีการอัปเดตความคืบหน้าเป็นเวลานาน กรุณาดำเนินการ` + foot;
    default:
      return null;
  }
};

// Map outbox event_type → message builder. Returns null for unknown events.
const buildByEvent = (eventType, data) => {
  switch (eventType) {
    case 'COMPLAINT_STATUS_CHANGED':    return buildComplaintStatusMessage(data);
    case 'COMPLAINT_PROGRESS_UPDATED':  return buildComplaintProgressMessage(data);
    case 'COMPLAINT_MORE_INFO_REQUIRED':return buildComplaintMoreInfoMessage(data);
    case 'COMPLAINT_RESOLVED':          return buildComplaintResolvedMessage(data);
    case 'COMPLAINT_CLOSED':            return buildComplaintClosedMessage(data);
    default:                            return null;
  }
};

module.exports = {
  STATUS_LABELS,
  statusLabel,
  detailUrl,
  buildByEvent,
  buildStaffByEvent,
  buildComplaintStatusMessage,
  buildComplaintProgressMessage,
  buildComplaintMoreInfoMessage,
  buildComplaintResolvedMessage,
  buildComplaintClosedMessage,
};
