'use strict';

const complaintModel = require('../models/complaintModel');
const attachmentModel = require('../models/attachmentModel');
const citizenModel = require('../models/citizenModel');
const { success, successList, error } = require('../utils/response');
const { parsePagination, paginationMeta } = require('../utils/pagination');

// PUT /api/citizen/profile
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, id_card, address } = req.body;

    if (!full_name || !String(full_name).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุชื่อ-นามสกุล', 400);
    }

    await citizenModel.updateProfile(req.citizen.id, { full_name, phone, id_card, address });

    const citizen = await citizenModel.findById(req.citizen.id);
    return success(res, { citizen });
  } catch (err) {
    next(err);
  }
};

// POST /api/citizen/complaints — Authenticated citizen submit (linked to citizen_id)
const submitComplaint = async (req, res, next) => {
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
      citizenId: req.citizen.id,
      isAnonymous: is_anonymous || false,
      provinceId: province_id,
      districtId: district_id,
      subdistrictId: subdistrict_id,
      postalCode: postal_code,
      incidentAddress: incident_address,
      latitude: latitude || null,
      longitude: longitude || null,
      priority: priority || 'MEDIUM',
      source: 'PUBLIC',
      receivedBy: null,
    });

    const complaint = await complaintModel.findById(id);
    return success(res, { complaint }, 201);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return error(res, 'VALIDATION_ERROR', 'ข้อมูล Master Data ที่ระบุไม่ถูกต้อง', 400);
    }
    next(err);
  }
};

// GET /api/citizen/complaints — citizen's own complaints list
const listMyComplaints = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { rows, total } = await complaintModel.findByCitizenId(req.citizen.id, { limit, offset });
    return successList(res, rows, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/citizen/complaints/:complaint_number — citizen's own complaint detail
const getMyComplaint = async (req, res, next) => {
  try {
    const data = await complaintModel.findByNumberForTracking(req.params.complaint_number);
    if (!data) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    // Verify this complaint belongs to the citizen
    const full = await complaintModel.findByIdUnmasked(data.id);
    if (full.citizen_id !== req.citizen.id) {
      return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์ดูเรื่องนี้', 403);
    }

    return success(res, { complaint: data });
  } catch (err) {
    next(err);
  }
};

// POST /api/citizen/complaints/attachments — citizen upload attachment
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'VALIDATION_ERROR', 'กรุณาแนบไฟล์', 400);

    const { complaint_id } = req.body;
    if (!complaint_id) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ complaint_id', 400);

    const full = await complaintModel.findByIdUnmasked(complaint_id);
    if (!full) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    if (full.citizen_id !== req.citizen.id) {
      return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์แนบไฟล์กับเรื่องนี้', 403);
    }

    const id = await attachmentModel.create({
      complaintId: complaint_id,
      updateId: null,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: null,
      uploadedByCitizen: req.citizen.id,
      uploadSource: 'PUBLIC',
    });

    const attachment = await attachmentModel.findById(id);
    return success(res, { attachment }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProfile, submitComplaint, listMyComplaints, getMyComplaint, uploadAttachment };
