'use strict';

const citizenModel = require('../models/citizenModel');
const { error } = require('../utils/response');

// ต้องยอมรับประกาศความเป็นส่วนตัว (PDPA) ก่อนส่งข้อมูลส่วนบุคคลเข้าระบบ
const requireCitizenConsent = async (req, res, next) => {
  try {
    if (!(await citizenModel.hasConsent(req.citizen.id))) {
      return error(res, 'CONSENT_REQUIRED', 'กรุณายอมรับประกาศความเป็นส่วนตัวก่อนใช้งาน', 403);
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireCitizenConsent };
