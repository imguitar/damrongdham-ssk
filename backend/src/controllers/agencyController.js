'use strict';

const agencyModel = require('../models/agencyModel');
const { success, error } = require('../utils/response');

// GET /api/agencies
const list = async (req, res, next) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const agencies = await agencyModel.findAll(includeInactive);
    return success(res, { agencies });
  } catch (err) {
    next(err);
  }
};

// GET /api/agencies/:id
const getById = async (req, res, next) => {
  try {
    const agency = await agencyModel.findById(req.params.id);
    if (!agency) return error(res, 'NOT_FOUND', 'ไม่พบหน่วยงาน', 404);
    return success(res, { agency });
  } catch (err) {
    next(err);
  }
};

// POST /api/agencies
const create = async (req, res, next) => {
  try {
    const { name, short_name, contact_phone, contact_email, address } = req.body;
    if (!name || !String(name).trim()) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุชื่อหน่วยงาน', 400);

    const id = await agencyModel.create({ name, short_name, contact_phone, contact_email, address });
    const agency = await agencyModel.findById(id);
    return success(res, { agency }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'DUPLICATE', 'ชื่อหน่วยงานนี้มีอยู่แล้ว', 409);
    next(err);
  }
};

// PUT /api/agencies/:id
const update = async (req, res, next) => {
  try {
    const agency = await agencyModel.findById(req.params.id);
    if (!agency) return error(res, 'NOT_FOUND', 'ไม่พบหน่วยงาน', 404);

    const { name, short_name, contact_phone, contact_email, address } = req.body;
    if (!name || !String(name).trim()) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุชื่อหน่วยงาน', 400);

    await agencyModel.update(req.params.id, { name, short_name, contact_phone, contact_email, address });
    const updated = await agencyModel.findById(req.params.id);
    return success(res, { agency: updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/agencies/:id/toggle-status
const toggleStatus = async (req, res, next) => {
  try {
    const result = await agencyModel.toggleStatus(req.params.id);
    if (result === null) return error(res, 'NOT_FOUND', 'ไม่พบหน่วยงาน', 404);
    return success(res, { is_active: result === 1 });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, toggleStatus };
