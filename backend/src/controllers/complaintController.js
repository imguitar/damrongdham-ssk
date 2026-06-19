'use strict';

const complaintModel = require('../models/complaintModel');
const anonymousRevealModel = require('../models/anonymousRevealModel');
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
      return error(res, 'FORBIDDEN', 'ไม่สามารถแก้ไขเรื่องที่ปิดแล้ว', 400);
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

module.exports = { list, getById, create, update, getTimeline, getUpdates, revealIdentity };
