'use strict';

const complaintModel = require('../models/complaintModel');
const anonymousRevealModel = require('../models/anonymousRevealModel');
const agencyModel = require('../models/agencyModel');
const { executeTransition, executeAssign } = require('../services/complaintService');
const { writeAuditLog } = require('../middleware/auditLog');
const { success, successList, error } = require('../utils/response');
const { parsePagination, paginationMeta } = require('../utils/pagination');

const AGENCY_ROLES = ['agency_officer', 'agency_head'];

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const {
      status, category_id, agency_id, district_id, province_id,
      priority, is_overdue, search, date_from, date_to,
      sort, order,
    } = req.query;

    const currentUserAgencyId = AGENCY_ROLES.includes(req.user.role)
      ? req.user.agency_id
      : null;

    const { rows, total } = await complaintModel.findAll({
      status, category_id, agency_id, district_id, province_id,
      priority, is_overdue, search, date_from, date_to,
      sort, order, limit, offset,
      currentUserAgencyId,
    });

    return successList(res, rows, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    return success(res, { complaint });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      title, description,
      service_type_id, complaint_nature_id, complainant_type_id, channel_id, category_id,
      complainant_name, complainant_id_card, complainant_phone,
      complainant_address, complainant_email, is_anonymous,
      province_id, district_id, subdistrict_id, postal_code, incident_address,
      latitude, longitude, priority,
    } = req.body;

    const id = await complaintModel.create({
      title, description,
      serviceTypeId: service_type_id,
      complaintNatureId: complaint_nature_id,
      complainantTypeId: complainant_type_id,
      channelId: channel_id,
      categoryId: category_id || null,
      complainantName: complainant_name,
      complainantIdCard: complainant_id_card,
      complainantPhone: complainant_phone,
      complainantAddress: complainant_address,
      complainantEmail: complainant_email,
      citizenId: null,
      isAnonymous: is_anonymous || false,
      provinceId: province_id,
      districtId: district_id,
      subdistrictId: subdistrict_id,
      postalCode: postal_code,
      incidentAddress: incident_address,
      latitude: latitude || null,
      longitude: longitude || null,
      priority: priority || 'MEDIUM',
      source: 'STAFF',
      receivedBy: req.user.id,
    });

    const complaint = await complaintModel.findById(id);

    writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'complaints',
      resourceId: id,
      details: { complaint_number: complaint.complaint_number },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { complaint }, 201);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return error(res, 'VALIDATION_ERROR', 'ข้อมูล Master Data ที่ระบุไม่ถูกต้อง', 400);
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    if (complaint.status === 'CLOSED') {
      return error(res, 'BAD_REQUEST', 'ไม่สามารถแก้ไขเรื่องที่ปิดแล้ว', 400);
    }

    await complaintModel.update(req.params.id, req.body);

    writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'complaints',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const updated = await complaintModel.findById(req.params.id);
    return success(res, { complaint: updated });
  } catch (err) {
    next(err);
  }
};

const getTimeline = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const timeline = await complaintModel.getTimeline(req.params.id);
    return success(res, { complaint_number: complaint.complaint_number, timeline });
  } catch (err) {
    next(err);
  }
};

const getUpdates = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const updates = await complaintModel.findUpdatesByComplaintId(req.params.id);
    return success(res, { updates });
  } catch (err) {
    next(err);
  }
};

// POST /api/complaints/:id/reveal-identity — super_admin only (5.14)
const revealIdentity = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุเหตุผลการเปิดเผยตัวตน', 400);
    }

    const complaint = await complaintModel.findByIdUnmasked(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    if (!complaint.is_anonymous) {
      return error(res, 'BAD_REQUEST', 'เรื่องนี้ไม่ได้ปกปิดตัวตน', 400);
    }

    await anonymousRevealModel.create({
      complaintId: complaint.id,
      revealedBy: req.user.id,
      reason,
    });

    writeAuditLog({
      userId: req.user.id,
      action: 'REVEAL_IDENTITY',
      resource: 'complaints',
      resourceId: complaint.id,
      details: { complaint_number: complaint.complaint_number, reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { complaint, message: 'เปิดเผยตัวตนสำเร็จ และบันทึก Log แล้ว' });
  } catch (err) {
    next(err);
  }
};

// ── Status Workflow (T-01, T-03, T-09, T-10, T-11, T-12) ──────────────────────

const handleServiceError = (err, res, next) => {
  if (err.statusCode && err.statusCode < 500) {
    return error(res, err.code || 'ERROR', err.message, err.statusCode);
  }
  return next(err);
};

// PATCH /:id/screen — T-01: NEW → SCREENING, T-12: RETURNED → SCREENING
const screen = async (req, res, next) => {
  try {
    await executeTransition(req.params.id, 'screen', req.user.id, req.user.role);
    writeAuditLog({ userId: req.user.id, action: 'SCREEN_COMPLAINT', resource: 'complaints', resourceId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });
    const complaint = await complaintModel.findById(req.params.id);
    return success(res, { complaint });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

// PATCH /:id/reject — T-03: SCREENING → REJECTED
const reject = async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;
    await executeTransition(req.params.id, 'reject', req.user.id, req.user.role, { rejectionReason: rejection_reason });
    writeAuditLog({ userId: req.user.id, action: 'REJECT_COMPLAINT', resource: 'complaints', resourceId: req.params.id, details: { rejection_reason }, ipAddress: req.ip, userAgent: req.get('user-agent') });
    const complaint = await complaintModel.findById(req.params.id);
    return success(res, { complaint });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

// POST /:id/assign — T-02: SCREENING → ASSIGNED (creates assignment record)
const assign = async (req, res, next) => {
  try {
    const { agency_id, note } = req.body;
    if (!agency_id) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ agency_id', 400);

    const agency = await agencyModel.findById(agency_id);
    if (!agency || !agency.is_active) return error(res, 'VALIDATION_ERROR', 'ไม่พบหน่วยงาน หรือหน่วยงานไม่ active', 400);

    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const { to, dueDate, assignmentId } = await executeAssign(complaint, req.user.id, req.user.role, { agencyId: agency_id, note });

    writeAuditLog({ userId: req.user.id, action: 'ASSIGN_COMPLAINT', resource: 'complaints', resourceId: complaint.id, details: { agency_id, due_date: dueDate, assignment_id: assignmentId }, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const updated = await complaintModel.findById(req.params.id);
    return success(res, { complaint: updated, due_date: dueDate, assignment_id: assignmentId });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

// PATCH /:id/review — T-09: RESOLVED → REVIEWING
const review = async (req, res, next) => {
  try {
    await executeTransition(req.params.id, 'review', req.user.id, req.user.role);
    writeAuditLog({ userId: req.user.id, action: 'REVIEW_COMPLAINT', resource: 'complaints', resourceId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });
    const complaint = await complaintModel.findById(req.params.id);
    return success(res, { complaint });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

// PATCH /:id/close — T-10: REVIEWING → CLOSED
const close = async (req, res, next) => {
  try {
    const { closed_summary } = req.body;
    await executeTransition(req.params.id, 'close', req.user.id, req.user.role, { closedSummary: closed_summary });
    writeAuditLog({ userId: req.user.id, action: 'CLOSE_COMPLAINT', resource: 'complaints', resourceId: req.params.id, details: { closed_summary }, ipAddress: req.ip, userAgent: req.get('user-agent') });
    const complaint = await complaintModel.findById(req.params.id);
    return success(res, { complaint });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

// PATCH /:id/send-back — T-11: REVIEWING → IN_PROGRESS
const sendBack = async (req, res, next) => {
  try {
    await executeTransition(req.params.id, 'sendBack', req.user.id, req.user.role);
    writeAuditLog({ userId: req.user.id, action: 'SENDBACK_COMPLAINT', resource: 'complaints', resourceId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });
    const complaint = await complaintModel.findById(req.params.id);
    return success(res, { complaint });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

// PATCH /:id/self-close — SCREENING → CLOSED (center handles itself)
const selfClose = async (req, res, next) => {
  try {
    const { closed_summary } = req.body;
    await executeTransition(req.params.id, 'selfClose', req.user.id, req.user.role, { closedSummary: closed_summary });
    writeAuditLog({ userId: req.user.id, action: 'SELF_CLOSE_COMPLAINT', resource: 'complaints', resourceId: req.params.id, details: { closed_summary }, ipAddress: req.ip, userAgent: req.get('user-agent') });
    const complaint = await complaintModel.findById(req.params.id);
    return success(res, { complaint });
  } catch (err) {
    return handleServiceError(err, res, next);
  }
};

module.exports = { list, getById, create, update, getTimeline, getUpdates, revealIdentity, screen, reject, assign, review, close, sendBack, selfClose };
