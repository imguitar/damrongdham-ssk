'use strict';

const userModel = require('../models/userModel');
const authService = require('../services/authService');
const { writeAuditLog } = require('../middleware/auditLog');
const { success, error } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ username และ password', 400);
    }

    const user = await userModel.findByUsername(username);
    if (!user) {
      return error(res, 'INVALID_CREDENTIALS', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return error(res, 'INVALID_CREDENTIALS', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
    }

    const token = authService.generateToken({
      id: user.id,
      username: user.username,
      role: user.role_name,
      agency_id: user.agency_id,
      type: 'staff',
    });

    userModel.updateLastLogin(user.id);

    writeAuditLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'users',
      resourceId: user.id,
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const { password_hash, ...userWithoutHash } = user;
    return success(res, { token, user: userWithoutHash });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return error(res, 'USER_NOT_FOUND', 'ไม่พบข้อมูลผู้ใช้', 404);
    }
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่', 400);
    }

    if (new_password.length < 6) {
      return error(res, 'VALIDATION_ERROR', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 400);
    }

    const currentHash = await userModel.getPasswordHash(req.user.id);
    if (!currentHash) {
      return error(res, 'USER_NOT_FOUND', 'ไม่พบข้อมูลผู้ใช้', 404);
    }

    const isValid = await authService.verifyPassword(current_password, currentHash);
    if (!isValid) {
      return error(res, 'INVALID_PASSWORD', 'รหัสผ่านปัจจุบันไม่ถูกต้อง', 400);
    }

    const newHash = await authService.hashPassword(new_password);
    await userModel.updatePassword(req.user.id, newHash);

    writeAuditLog({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      resource: 'users',
      resourceId: req.user.id,
      details: { username: req.user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, { message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  return success(res, { message: 'ออกจากระบบสำเร็จ' });
};

module.exports = { login, me, changePassword, logout };
