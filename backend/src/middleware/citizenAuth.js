'use strict';

const pool = require('../config/database');
const authService = require('../services/authService');
const { error } = require('../utils/response');

const citizenAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ', 401);
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = authService.verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'TOKEN_EXPIRED', 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
    }
    return error(res, 'INVALID_TOKEN', 'Token ไม่ถูกต้อง', 401);
  }

  if (payload.type !== 'citizen') {
    return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง endpoint นี้', 403);
  }

  try {
    // บัญชีที่ผู้ดูแลระบบปิดใช้งาน — token ที่ออกไปแล้วต้องใช้ไม่ได้ทันที
    const [[row]] = await pool.query('SELECT is_active FROM citizens WHERE id = ?', [payload.id]);
    if (!row || !row.is_active) {
      return error(res, 'ACCOUNT_DISABLED', 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเจ้าหน้าที่', 401);
    }
  } catch (err) {
    return next(err);
  }

  req.citizen = payload;
  return next();
};

module.exports = { citizenAuthenticate };
