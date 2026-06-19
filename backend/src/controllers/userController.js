'use strict';

const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { success, successList, error } = require('../utils/response');
const { parsePagination, paginationMeta } = require('../utils/pagination');
const { writeAuditLog } = require('../middleware/auditLog');
const pool = require('../config/database');

const SALT_ROUNDS = 12;

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// GET /api/users
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { search, role_id, is_active } = req.query;

    const isActiveFilter = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

    const { rows, total } = await userModel.findAll({ search, roleId: role_id, isActive: isActiveFilter, limit, offset });
    return successList(res, rows, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/me — own profile (req.params.id is undefined for /me pattern)
const getMe = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) return error(res, 'NOT_FOUND', 'ไม่พบผู้ใช้', 404);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
const getById = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.params.id);
    if (!user) return error(res, 'NOT_FOUND', 'ไม่พบผู้ใช้', 404);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users
const create = async (req, res, next) => {
  try {
    const { username, password, full_name, email, phone, role_id, agency_id } = req.body;

    if (!username || !password || !full_name || !role_id) {
      return error(res, 'VALIDATION_ERROR', 'username, password, full_name, role_id เป็นข้อมูลที่จำเป็น', 400);
    }

    // Validate role exists
    const [[role]] = await pool.query('SELECT id, code FROM roles WHERE id = ?', [role_id]);
    if (!role) return error(res, 'VALIDATION_ERROR', 'role_id ไม่ถูกต้อง', 400);

    // admin cannot create super_admin
    if (req.user.role === 'admin' && role.code === 'super_admin') {
      return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์สร้างผู้ใช้บทบาท super_admin', 403);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = await userModel.createUser({ username, passwordHash, fullName: full_name, email, phone, roleId: role_id, agencyId: agency_id });

    writeAuditLog({ userId: req.user.id, action: 'CREATE_USER', resource: 'users', resourceId: id, details: { username }, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const created = await userModel.findUserById(id);
    return success(res, { user: created }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'DUPLICATE', 'username หรือ email นี้มีอยู่แล้วในระบบ', 409);
    next(err);
  }
};

// PUT /api/users/:id
const update = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.params.id);
    if (!user) return error(res, 'NOT_FOUND', 'ไม่พบผู้ใช้', 404);

    const { full_name, email, phone, role_id, agency_id } = req.body;
    if (!full_name || !role_id) {
      return error(res, 'VALIDATION_ERROR', 'full_name และ role_id เป็นข้อมูลที่จำเป็น', 400);
    }

    const [[role]] = await pool.query('SELECT id, code FROM roles WHERE id = ?', [role_id]);
    if (!role) return error(res, 'VALIDATION_ERROR', 'role_id ไม่ถูกต้อง', 400);

    if (req.user.role === 'admin' && role.code === 'super_admin') {
      return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์กำหนดบทบาท super_admin', 403);
    }

    await userModel.updateUser(req.params.id, { fullName: full_name, email, phone, roleId: role_id, agencyId: agency_id });

    writeAuditLog({ userId: req.user.id, action: 'UPDATE_USER', resource: 'users', resourceId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const updated = await userModel.findUserById(req.params.id);
    return success(res, { user: updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/toggle-status
const toggleStatus = async (req, res, next) => {
  try {
    // Prevent deactivating self
    if (String(req.params.id) === String(req.user.id)) {
      return error(res, 'BAD_REQUEST', 'ไม่สามารถปิดใช้งานบัญชีของตนเองได้', 400);
    }

    const result = await userModel.toggleUserStatus(req.params.id);
    if (result === null) return error(res, 'NOT_FOUND', 'ไม่พบผู้ใช้', 404);

    writeAuditLog({ userId: req.user.id, action: result === 1 ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', resource: 'users', resourceId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });

    return success(res, { is_active: result === 1 });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.params.id);
    if (!user) return error(res, 'NOT_FOUND', 'ไม่พบผู้ใช้', 404);

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    await userModel.updatePassword(req.params.id, passwordHash);

    writeAuditLog({ userId: req.user.id, action: 'RESET_PASSWORD', resource: 'users', resourceId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });

    return success(res, { temp_password: tempPassword, message: 'รีเซ็ตรหัสผ่านเรียบร้อย กรุณาแจ้งรหัสผ่านชั่วคราวให้ผู้ใช้เปลี่ยนทันที' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getMe, getById, create, update, toggleStatus, resetPassword };
