'use strict';

const masterDataModel = require('../models/masterDataModel');
const { success, error } = require('../utils/response');
const { writeAuditLog } = require('../middleware/auditLog');

// ====== Categories ======

const listCategories = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllCategories();
    return success(res, { categories: rows });
  } catch (err) { next(err); }
};

const getCategory = async (req, res, next) => {
  try {
    const row = await masterDataModel.findCategoryById(req.params.id);
    if (!row) return error(res, 'NOT_FOUND', 'ไม่พบประเภทเรื่อง', 404);
    return success(res, { category: row });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, sla_days } = req.body;
    if (!name || !sla_days) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name และ sla_days', 400);
    }
    const id = await masterDataModel.createCategory({ name, description, slaDays: sla_days });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'complaint_categories', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, sla_days } = req.body;
    if (!name || !sla_days) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name และ sla_days', 400);
    }
    await masterDataModel.updateCategory(req.params.id, { name, description, slaDays: sla_days });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'complaint_categories', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ is_active', 400);
    }
    await masterDataModel.toggleCategoryStatus(req.params.id, is_active);
    return success(res, { message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Channels ======

const listChannels = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllChannels();
    return success(res, { channels: rows });
  } catch (err) { next(err); }
};

const createChannel = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    const id = await masterDataModel.createChannel({ name });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'complaint_channels', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateChannel = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateChannel(req.params.id, { name });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'complaint_channels', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

const toggleChannelStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ is_active', 400);
    await masterDataModel.toggleChannelStatus(req.params.id, is_active);
    return success(res, { message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Provinces ======

const listProvinces = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllProvinces();
    return success(res, { provinces: rows });
  } catch (err) { next(err); }
};

const createProvince = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    const id = await masterDataModel.createProvince({ name, code });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'provinces', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateProvince = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateProvince(req.params.id, { name, code });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'provinces', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Districts ======

const listDistricts = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllDistricts(req.query.province_id);
    return success(res, { districts: rows });
  } catch (err) { next(err); }
};

const listDistrictsByProvince = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllDistricts(req.params.id);
    return success(res, { districts: rows });
  } catch (err) { next(err); }
};

const createDistrict = async (req, res, next) => {
  try {
    const { name, code, province_id } = req.body;
    if (!name || !province_id) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name และ province_id', 400);
    const id = await masterDataModel.createDistrict({ name, code, provinceId: province_id });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'districts', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateDistrict = async (req, res, next) => {
  try {
    const { name, code, province_id } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateDistrict(req.params.id, { name, code, provinceId: province_id });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'districts', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Subdistricts ======

const listSubdistrictsByDistrict = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findSubdistrictsByDistrictId(req.params.id);
    return success(res, { subdistricts: rows });
  } catch (err) { next(err); }
};

const createSubdistrict = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    const id = await masterDataModel.createSubdistrict({ name, code, districtId: req.params.id });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'subdistricts', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateSubdistrict = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateSubdistrict(req.params.id, { name, code });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'subdistricts', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Service Types ======

const listServiceTypes = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllServiceTypes();
    return success(res, { service_types: rows });
  } catch (err) { next(err); }
};

const createServiceType = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    const id = await masterDataModel.createServiceType({ name, description });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'service_types', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateServiceType = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateServiceType(req.params.id, { name, description });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'service_types', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

const toggleServiceTypeStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ is_active', 400);
    await masterDataModel.toggleServiceTypeStatus(req.params.id, is_active);
    return success(res, { message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Complaint Natures ======

const listComplaintNatures = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllComplaintNatures();
    return success(res, { complaint_natures: rows });
  } catch (err) { next(err); }
};

const createComplaintNature = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    const id = await masterDataModel.createComplaintNature({ name, description });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'complaint_natures', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateComplaintNature = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateComplaintNature(req.params.id, { name, description });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'complaint_natures', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

const toggleComplaintNatureStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ is_active', 400);
    await masterDataModel.toggleComplaintNatureStatus(req.params.id, is_active);
    return success(res, { message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) { next(err); }
};

// ====== Complainant Types ======

const listComplainantTypes = async (req, res, next) => {
  try {
    const rows = await masterDataModel.findAllComplainantTypes();
    return success(res, { complainant_types: rows });
  } catch (err) { next(err); }
};

const createComplainantType = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    const id = await masterDataModel.createComplainantType({ name });
    writeAuditLog({ userId: req.user.id, action: 'CREATE', resource: 'complainant_types', resourceId: id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { id }, 201);
  } catch (err) { next(err); }
};

const updateComplainantType = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ name', 400);
    await masterDataModel.updateComplainantType(req.params.id, { name });
    writeAuditLog({ userId: req.user.id, action: 'UPDATE', resource: 'complainant_types', resourceId: req.params.id, details: req.body, ipAddress: req.ip, userAgent: req.get('user-agent') });
    return success(res, { message: 'อัปเดตสำเร็จ' });
  } catch (err) { next(err); }
};

const toggleComplainantTypeStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ is_active', 400);
    await masterDataModel.toggleComplainantTypeStatus(req.params.id, is_active);
    return success(res, { message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) { next(err); }
};

module.exports = {
  listCategories, getCategory, createCategory, updateCategory, toggleCategoryStatus,
  listChannels, createChannel, updateChannel, toggleChannelStatus,
  listProvinces, createProvince, updateProvince,
  listDistricts, listDistrictsByProvince, createDistrict, updateDistrict,
  listSubdistrictsByDistrict, createSubdistrict, updateSubdistrict,
  listServiceTypes, createServiceType, updateServiceType, toggleServiceTypeStatus,
  listComplaintNatures, createComplaintNature, updateComplaintNature, toggleComplaintNatureStatus,
  listComplainantTypes, createComplainantType, updateComplainantType, toggleComplainantTypeStatus,
};
