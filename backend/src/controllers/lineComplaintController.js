'use strict';

const crypto = require('crypto');
const pool = require('../config/database');
const complaintModel = require('../models/complaintModel');
const infoRequestModel = require('../models/infoRequestModel');
const identityModel = require('../models/citizenIdentityModel');
const prefModel = require('../models/notificationPrefModel');
const outboxSvc = require('../services/notificationOutboxService');
const messaging = require('../services/lineMessagingService');
const { LINE_CHANNEL_NAME } = require('../services/lineIntakeService');
const { writeAuditLog } = require('../middleware/auditLog');
const { formatThaiDate } = require('../utils/thaiDate');
const { success, error } = require('../utils/response');

// ระบบหลังบ้าน — ส่วน LINE ของเรื่องร้องเรียน:
// ขอข้อมูลเพิ่มเติม / ดูประวัติข้อความ / เอกสารที่ประชาชนส่งเพิ่ม / ส่งข้อความถึงผู้ร้อง
// ทุก endpoint ตรวจสิทธิ์เข้าถึง "เรื่องนั้น" ก่อนเสมอ (RBAC เดิม + ownership ของหน่วยงาน)

const AGENCY_ROLES = ['agency_officer', 'agency_head'];
const CAN_SEE_PII = ['super_admin', 'admin', 'officer'];
const MAX_MESSAGE_LENGTH = 1000;
const NOTIFICATION_LOG_LIMIT = 20;

// เจ้าหน้าที่หน่วยงานเข้าถึงได้เฉพาะเรื่องที่มอบหมายให้หน่วยงานตน
const hasAgencyAccess = async (complaintId, agencyId) => {
  if (!agencyId) return false;
  const [[row]] = await pool.query(
    'SELECT 1 AS ok FROM complaint_assignments WHERE complaint_id = ? AND agency_id = ? LIMIT 1',
    [complaintId, agencyId]
  );
  return Boolean(row);
};

// โหลดเรื่อง + ตรวจสิทธิ์ — ส่ง response เองเมื่อไม่ผ่าน แล้วคืน null
const loadComplaint = async (req, res) => {
  const complaint = await complaintModel.findById(req.params.id);
  if (!complaint) { error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404); return null; }

  if (AGENCY_ROLES.includes(req.user.role)) {
    const ok = await hasAgencyAccess(complaint.id, req.user.agency_id);
    if (!ok) { error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงเรื่องนี้', 403); return null; }
  }
  return complaint;
};

// เจ้าของเรื่อง (ไม่ผ่าน mask) — ใช้ภายในเท่านั้น
const complaintOwner = async (complaintId) => {
  const [[row]] = await pool.query(
    'SELECT citizen_id, complaint_number, status, is_anonymous FROM complaints WHERE id = ?',
    [complaintId]
  );
  return row || null;
};

// GET /api/complaints/:id/line — ข้อมูลแผง LINE ของเรื่อง
const getOverview = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const owner = await complaintOwner(complaint.id);
    const canSeePII = CAN_SEE_PII.includes(req.user.role);

    const identity = owner.citizen_id ? await identityModel.findByCitizen(owner.citizen_id, 'line') : null;
    const pref = owner.citizen_id ? await prefModel.getByCitizen(owner.citizen_id) : null;

    const [logs] = await pool.query(
      `SELECT id, event_type, status, provider_message_id, error_code, error_message, sent_at, created_at
       FROM notification_logs
       WHERE complaint_id = ? AND recipient_type = 'citizen'
       ORDER BY created_at DESC LIMIT ?`,
      [complaint.id, NOTIFICATION_LOG_LIMIT]
    );

    const [pending] = await pool.query(
      `SELECT id, event_type, status, attempt_count, next_attempt_at, last_error, created_at
       FROM notification_outbox
       WHERE complaint_id = ? AND recipient_type = 'citizen' AND status IN ('pending','processing','retry')
       ORDER BY created_at DESC`,
      [complaint.id]
    );

    const infoRequests = await infoRequestModel.findByComplaint(complaint.id);
    const responses = await infoRequestModel.findResponsesByComplaint(complaint.id);

    const [documents] = await pool.query(
      `SELECT id, file_name, file_size, file_type, upload_source, info_request_id, created_at
       FROM complaint_attachments
       WHERE complaint_id = ? AND (upload_source = 'LINE' OR uploaded_by_citizen IS NOT NULL)
       ORDER BY created_at DESC`,
      [complaint.id]
    );

    // เรื่องปกปิดตัวตน: ไม่เปิดเผยชื่อ LINE ให้ผู้ที่ไม่มีสิทธิ์เห็นข้อมูลผู้ร้อง
    const hideName = owner.is_anonymous && !CAN_SEE_PII.includes(req.user.role);

    // ผูกบัญชีแล้วแต่ยังไม่เพิ่มเพื่อน OA → push ส่งไม่ถึง (LINE 403) ต้องเตือนเจ้าหน้าที่
    const friendship = identity
      ? await messaging.getFriendshipStatus(identity.provider_user_id)
      : { friend: null };

    return success(res, {
      channel: { name: complaint.channel_name, is_line: complaint.channel_name === LINE_CHANNEL_NAME },
      citizen: {
        linked: Boolean(identity),
        display_name: identity && !hideName ? identity.display_name : null,
        linked_at: identity ? identity.linked_at : null,
        notifications_enabled: pref ? Boolean(pref.line_enabled) : true,
        oa_friend: friendship.friend, // true / false (ส่งไม่ถึง) / null (ตรวจไม่ได้)
      },
      notification_logs: logs,
      notification_pending: pending,
      info_requests: infoRequests.map((r) => ({
        ...r,
        responses: responses.filter((x) => x.info_request_id === r.id),
      })),
      documents,
      can_see_pii: canSeePII,
    });
  } catch (err) {
    next(err);
  }
};

// enqueue ข้อความ "ขอข้อมูลเพิ่มเติม" เข้า outbox เดิม (worker เป็นผู้ส่งจริง)
// payload มีเฉพาะข้อความที่เจ้าหน้าที่พิมพ์ + กำหนดส่ง (ไม่มี PII ของผู้ร้อง)
const enqueueInfoRequest = async ({ complaintId, citizenId, infoRequestId, notifyCount, message, dueDate }) => {
  await outboxSvc.enqueue(null, {
    eventType: 'COMPLAINT_MORE_INFO_REQUIRED',
    citizenId,
    complaintId,
    idempotencyKey: `complaint:${complaintId}:info_request:${infoRequestId}:notify:${notifyCount}`,
    extra: {
      requestDetail: message || null,
      dueDate: dueDate ? formatThaiDate(dueDate) : null,
    },
  });
};

// POST /api/complaints/:id/info-requests — เจ้าหน้าที่ขอข้อมูล/เอกสารเพิ่มเติม
const createInfoRequest = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const { message, due_date } = req.body;
    if (!message || !String(message).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุรายการข้อมูลหรือเอกสารที่ต้องการ', 400);
    }
    if (String(message).length > MAX_MESSAGE_LENGTH) {
      return error(res, 'VALIDATION_ERROR', `ข้อความต้องไม่เกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร`, 400);
    }
    if (due_date && Number.isNaN(Date.parse(due_date))) {
      return error(res, 'VALIDATION_ERROR', 'รูปแบบวันที่ครบกำหนดไม่ถูกต้อง', 400);
    }

    const owner = await complaintOwner(complaint.id);
    const identity = owner.citizen_id ? await identityModel.findByCitizen(owner.citizen_id, 'line') : null;

    const infoRequestId = await infoRequestModel.create({
      complaintId: complaint.id,
      requestedBy: req.user.id,
      message: String(message).trim(),
      dueDate: due_date || null,
    });

    let delivery = 'not_sent';
    if (owner.citizen_id && identity) {
      await enqueueInfoRequest({
        complaintId: complaint.id,
        citizenId: owner.citizen_id,
        infoRequestId,
        notifyCount: 0,
        message: String(message).trim(),
        dueDate: due_date || null,
      });
      await infoRequestModel.markNotified(infoRequestId);
      delivery = 'queued';
    }

    writeAuditLog({
      userId: req.user.id,
      action: 'INFO_REQUEST_CREATED',
      resource: 'complaint_info_requests',
      resourceId: infoRequestId,
      details: { complaint_id: complaint.id, complaint_number: owner.complaint_number, delivery, due_date: due_date || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const created = await infoRequestModel.findById(infoRequestId);
    return success(res, { info_request: created, delivery }, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/complaints/:id/info-requests
const listInfoRequests = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const requests = await infoRequestModel.findByComplaint(complaint.id);
    const responses = await infoRequestModel.findResponsesByComplaint(complaint.id);
    return success(res, {
      info_requests: requests.map((r) => ({ ...r, responses: responses.filter((x) => x.info_request_id === r.id) })),
    });
  } catch (err) {
    next(err);
  }
};

// โหลดคำขอที่อยู่ใต้เรื่องนี้จริง (กันการอ้าง id ข้ามเรื่อง)
const loadInfoRequest = async (complaintId, res, reqId) => {
  const infoRequest = await infoRequestModel.findById(reqId);
  if (!infoRequest || infoRequest.complaint_id !== Number(complaintId)) {
    error(res, 'NOT_FOUND', 'ไม่พบคำขอข้อมูลเพิ่มเติม', 404);
    return null;
  }
  return infoRequest;
};

// POST /api/complaints/:id/info-requests/:reqId/resend — ส่งข้อความขอข้อมูลซ้ำ
const resendInfoRequest = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const infoRequest = await loadInfoRequest(complaint.id, res, req.params.reqId);
    if (!infoRequest) return undefined;
    if (infoRequest.status !== 'PENDING') {
      return error(res, 'BAD_REQUEST', 'คำขอนี้ไม่อยู่ในสถานะรอข้อมูลแล้ว', 400);
    }

    const identity = infoRequest.citizen_id ? await identityModel.findByCitizen(infoRequest.citizen_id, 'line') : null;
    if (!identity) {
      return error(res, 'LINE_NOT_LINKED', 'ผู้ร้องยังไม่ได้ผูกบัญชี LINE จึงส่งข้อความไม่ได้', 400);
    }

    await enqueueInfoRequest({
      complaintId: complaint.id,
      citizenId: infoRequest.citizen_id,
      infoRequestId: infoRequest.id,
      notifyCount: infoRequest.notify_count,
      message: infoRequest.message,
      dueDate: infoRequest.due_date,
    });
    await infoRequestModel.markNotified(infoRequest.id);

    writeAuditLog({
      userId: req.user.id,
      action: 'INFO_REQUEST_RESENT',
      resource: 'complaint_info_requests',
      resourceId: infoRequest.id,
      details: { complaint_id: complaint.id, complaint_number: infoRequest.complaint_number, attempt: infoRequest.notify_count + 1 },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { message: 'ส่งคำขอข้อมูลเพิ่มเติมเข้าคิวแจ้งเตือนแล้ว' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/complaints/:id/info-requests/:reqId/cancel
const cancelInfoRequest = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const infoRequest = await loadInfoRequest(complaint.id, res, req.params.reqId);
    if (!infoRequest) return undefined;

    const cancelled = await infoRequestModel.cancel(infoRequest.id);
    if (!cancelled) return error(res, 'BAD_REQUEST', 'คำขอนี้ถูกตอบกลับหรือยกเลิกไปแล้ว', 400);

    writeAuditLog({
      userId: req.user.id,
      action: 'INFO_REQUEST_CANCELLED',
      resource: 'complaint_info_requests',
      resourceId: infoRequest.id,
      details: { complaint_id: complaint.id, complaint_number: infoRequest.complaint_number },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { message: 'ยกเลิกคำขอข้อมูลเพิ่มเติมแล้ว' });
  } catch (err) {
    next(err);
  }
};

// POST /api/complaints/:id/line/notify — ส่งแจ้งผล/สถานะปัจจุบันซ้ำทาง LINE
// ใช้เมื่อการส่งครั้งก่อนล้มเหลว — ไม่เปลี่ยนสถานะเรื่อง และมี audit log ทุกครั้ง
const notifyStatus = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const owner = await complaintOwner(complaint.id);
    if (!owner.citizen_id) {
      return error(res, 'LINE_NOT_LINKED', 'เรื่องนี้ไม่มีผู้ร้องที่ผูกบัญชีในระบบ', 400);
    }
    const identity = await identityModel.findByCitizen(owner.citizen_id, 'line');
    if (!identity) {
      return error(res, 'LINE_NOT_LINKED', 'ผู้ร้องยังไม่ได้ผูกบัญชี LINE จึงส่งข้อความไม่ได้', 400);
    }

    const eventType = owner.status === 'CLOSED' ? 'COMPLAINT_CLOSED' : 'COMPLAINT_STATUS_CHANGED';
    // กันกดซ้ำรัว ๆ ภายในนาทีเดียวกัน (idempotency key ระดับนาที)
    const minuteBucket = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    await outboxSvc.enqueue(null, {
      eventType,
      citizenId: owner.citizen_id,
      complaintId: complaint.id,
      status: owner.status,
      idempotencyKey: `complaint:${complaint.id}:status:${owner.status}:manual:${minuteBucket}`,
    });

    writeAuditLog({
      userId: req.user.id,
      action: 'LINE_NOTIFY_RESENT',
      resource: 'complaints',
      resourceId: complaint.id,
      details: { complaint_number: owner.complaint_number, status: owner.status, event_type: eventType },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { message: 'ส่งการแจ้งเตือนเข้าคิวแล้ว ระบบจะส่งภายใน 1 นาที' });
  } catch (err) {
    next(err);
  }
};

// POST /api/complaints/:id/line/messages — ส่งข้อความที่เจ้าหน้าที่กำหนดเองถึงผู้ร้อง
// ส่งผ่าน outbox เดิมเพื่อให้ได้ retry/idempotency/log แบบเดียวกับ notification อื่น
const sendCustomMessage = async (req, res, next) => {
  try {
    const complaint = await loadComplaint(req, res);
    if (!complaint) return undefined;

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุข้อความที่ต้องการส่ง', 400);
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return error(res, 'VALIDATION_ERROR', `ข้อความต้องไม่เกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร`, 400);
    }

    const owner = await complaintOwner(complaint.id);
    if (!owner.citizen_id) {
      return error(res, 'LINE_NOT_LINKED', 'เรื่องนี้ไม่มีผู้ร้องที่ผูกบัญชีในระบบ', 400);
    }
    const identity = await identityModel.findByCitizen(owner.citizen_id, 'line');
    if (!identity) {
      return error(res, 'LINE_NOT_LINKED', 'ผู้ร้องยังไม่ได้ผูกบัญชี LINE จึงส่งข้อความไม่ได้', 400);
    }

    const pref = await prefModel.getByCitizen(owner.citizen_id);
    if (pref && !pref.line_enabled) {
      return error(res, 'LINE_NOTIFICATIONS_DISABLED', 'ผู้ร้องปิดรับการแจ้งเตือนทาง LINE ไว้', 400);
    }

    // payload เดียวกันจากผู้ส่งคนเดิมภายในนาทีเดียวกันจะสร้างคิวเพียงรายการเดียว
    const minuteBucket = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    const messageHash = crypto.createHash('sha256').update(message).digest('hex').slice(0, 16);
    await outboxSvc.enqueue(null, {
      eventType: 'COMPLAINT_CUSTOM_MESSAGE',
      citizenId: owner.citizen_id,
      complaintId: complaint.id,
      idempotencyKey: `complaint:${complaint.id}:custom:${req.user.id}:${minuteBucket}:${messageHash}`,
      extra: { customMessage: message },
    });

    // ไม่เก็บเนื้อหาข้อความใน audit เพื่อลดการทำสำเนาข้อมูลส่วนบุคคลโดยไม่จำเป็น
    writeAuditLog({
      userId: req.user.id,
      action: 'LINE_CUSTOM_MESSAGE_QUEUED',
      resource: 'complaints',
      resourceId: complaint.id,
      details: {
        complaint_number: owner.complaint_number,
        event_type: 'COMPLAINT_CUSTOM_MESSAGE',
        message_length: message.length,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { message: 'ส่งข้อความเข้าคิวแล้ว ระบบจะส่งภายใน 1 นาที' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview, createInfoRequest, listInfoRequests,
  resendInfoRequest, cancelInfoRequest, notifyStatus, sendCustomMessage,
};
