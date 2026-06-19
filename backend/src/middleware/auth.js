'use strict';

const authService = require('../services/authService');
const { error } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = authService.verifyToken(token);

    if (payload.type !== 'staff') {
      return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง endpoint นี้', 403);
    }

    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'TOKEN_EXPIRED', 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
    }
    return error(res, 'INVALID_TOKEN', 'Token ไม่ถูกต้อง', 401);
  }
};

module.exports = { authenticate };
