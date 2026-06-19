'use strict';

const { error } = require('../utils/response');

// Usage: authorize('super_admin', 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์ดำเนินการนี้', 403);
    }

    next();
  };
};

module.exports = { authorize };
