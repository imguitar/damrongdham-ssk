'use strict';

const complaintModel = require('../models/complaintModel');
const attachmentModel = require('../models/attachmentModel');
const masterDataModel = require('../models/masterDataModel');
const { success, error } = require('../utils/response');

// POST /api/public/complaints — Guest submit complaint
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
      source: 'PUBLIC',
      receivedBy: null,
    });

    const complaint = await complaintModel.findByNumberForTracking(
      (await complaintModel.findById(id)).complaint_number
    );

    return success(res, {
      complaint_number: complaint.complaint_number,
      id,
      status: 'NEW',
      message: 'ยื่นเรื่องร้องเรียนสำเร็จ',
    }, 201);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return error(res, 'VALIDATION_ERROR', 'ข้อมูล Master Data ที่ระบุไม่ถูกต้อง', 400);
    }
    next(err);
  }
};

// GET /api/public/complaints/track/:complaint_number — Public tracking
const trackComplaint = async (req, res, next) => {
  try {
    const data = await complaintModel.findByNumberForTracking(req.params.complaint_number);
    if (!data) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    return success(res, { complaint: data });
  } catch (err) {
    next(err);
  }
};

// POST /api/public/complaints/attachments — Guest upload attachment
const uploadPublicAttachment = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'VALIDATION_ERROR', 'กรุณาแนบไฟล์', 400);

    const { complaint_id } = req.body;
    if (!complaint_id) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ complaint_id', 400);

    const complaint = await complaintModel.findById(complaint_id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const id = await attachmentModel.create({
      complaintId: complaint_id,
      updateId: null,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: null,
      uploadedByCitizen: null,
      uploadSource: 'PUBLIC',
    });

    const attachment = await attachmentModel.findById(id);
    return success(res, { attachment }, 201);
  } catch (err) {
    next(err);
  }
};

// Public master data endpoints (active only, no auth)
const getPublicCategories = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllCategories(true);
    return success(res, { categories: rows });
  } catch (err) { next(err); }
};

const getPublicChannels = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllChannels(true);
    return success(res, { channels: rows });
  } catch (err) { next(err); }
};

const getPublicProvinces = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllProvinces(true);
    return success(res, { provinces: rows });
  } catch (err) { next(err); }
};

const getPublicDistricts = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllDistricts(req.query.province_id, true);
    return success(res, { districts: rows });
  } catch (err) { next(err); }
};

const getPublicServiceTypes = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllServiceTypes(true);
    return success(res, { service_types: rows });
  } catch (err) { next(err); }
};

const getPublicComplaintNatures = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllComplaintNatures(true);
    return success(res, { complaint_natures: rows });
  } catch (err) { next(err); }
};

const getPublicComplainantTypes = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllComplainantTypes(true);
    return success(res, { complainant_types: rows });
  } catch (err) { next(err); }
};

const getPublicSubdistricts = async (req, res, next) => {
  try {
    const { district_id } = req.query;
    if (!district_id) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ district_id', 400);
    const rows = await masterDataModel.findSubdistrictsByDistrictId(district_id, true);
    return success(res, { subdistricts: rows });
  } catch (err) { next(err); }
};

module.exports = {
  submitComplaint,
  trackComplaint,
  uploadPublicAttachment,
  getPublicCategories,
  getPublicChannels,
  getPublicProvinces,
  getPublicDistricts,
  getPublicServiceTypes,
  getPublicComplaintNatures,
  getPublicComplainantTypes,
  getPublicSubdistricts,
};
