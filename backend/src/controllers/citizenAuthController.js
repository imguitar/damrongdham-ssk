'use strict';

const citizenModel = require('../models/citizenModel');
const authService = require('../services/authService');
const { success, error } = require('../utils/response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, id_card, address } = req.body;

    if (!email || !password || !full_name) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ email, password และ full_name', 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      return error(res, 'VALIDATION_ERROR', 'รูปแบบ email ไม่ถูกต้อง', 400);
    }

    if (password.length < 6) {
      return error(res, 'VALIDATION_ERROR', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 400);
    }

    const existing = await citizenModel.findByEmail(email);
    if (existing) {
      return error(res, 'EMAIL_EXISTS', 'อีเมลนี้ถูกใช้งานแล้ว', 409);
    }

    const passwordHash = await authService.hashPassword(password);
    const citizenId = await citizenModel.create({
      email, passwordHash, fullName: full_name, phone, idCard: id_card, address,
    });

    const citizen = await citizenModel.findById(citizenId);
    const token = authService.generateToken({ id: citizenId, email, type: 'citizen' });

    return success(res, { token, citizen }, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ email และ password', 400);
    }

    const citizen = await citizenModel.findByEmail(email);
    if (!citizen) {
      return error(res, 'INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
    }

    const isValid = await authService.verifyPassword(password, citizen.password_hash);
    if (!isValid) {
      return error(res, 'INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
    }

    const token = authService.generateToken({ id: citizen.id, email: citizen.email, type: 'citizen' });

    citizenModel.updateLastLogin(citizen.id);

    const { password_hash, ...citizenData } = citizen;
    return success(res, { token, citizen: citizenData });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const citizen = await citizenModel.findById(req.citizen.id);
    if (!citizen) {
      return error(res, 'NOT_FOUND', 'ไม่พบข้อมูลสมาชิก', 404);
    }
    return success(res, { citizen });
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

    const currentHash = await citizenModel.getPasswordHash(req.citizen.id);
    if (!currentHash) {
      return error(res, 'NOT_FOUND', 'ไม่พบข้อมูลสมาชิก', 404);
    }

    const isValid = await authService.verifyPassword(current_password, currentHash);
    if (!isValid) {
      return error(res, 'INVALID_PASSWORD', 'รหัสผ่านปัจจุบันไม่ถูกต้อง', 400);
    }

    const newHash = await authService.hashPassword(new_password);
    await citizenModel.updatePassword(req.citizen.id, newHash);

    return success(res, { message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => success(res, { message: 'ออกจากระบบสำเร็จ' });

module.exports = { register, login, me, changePassword, logout };
