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
  buildComplaintStatusMessage,
  buildComplaintProgressMessage,
  buildComplaintMoreInfoMessage,
  buildComplaintResolvedMessage,
  buildComplaintClosedMessage,
};
