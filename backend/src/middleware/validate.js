'use strict';

const { error } = require('../utils/response');

// Validates complaint creation/submission body.
// complainant_phone is ALWAYS required (BR-16), even for anonymous complaints.
const validateComplaint = (req, res, next) => {
  const {
    title,
    description,
    service_type_id,
    complaint_nature_id,
    complainant_type_id,
    channel_id,
    complainant_phone,
  } = req.body;

  if (!title || !String(title).trim()) {
    return error(res, 'VALIDATION_ERROR', 'กรุณาระบุหัวเรื่อง', 400);
  }
  if (!description || !String(description).trim()) {
    return error(res, 'VALIDATION_ERROR', 'กรุณาระบุรายละเอียด', 400);
  }
  if (!service_type_id) {
    return error(res, 'VALIDATION_ERROR', 'กรุณาระบุประเภทงานบริการ', 400);
  }
  if (!complaint_nature_id) {
    return error(res, 'VALIDATION_ERROR', 'กรุณาระบุลักษณะเรื่อง', 400);
  }
  if (!complainant_type_id) {
    return error(res, 'VALIDATION_ERROR', 'กรุณาระบุประเภทผู้ร้องเรียน', 400);
  }
  if (!channel_id) {
    return error(res, 'VALIDATION_ERROR', 'กรุณาระบุช่องทางรับเรื่อง', 400);
  }
  if (!complainant_phone || !String(complainant_phone).trim()) {
    return error(
      res,
      'VALIDATION_ERROR',
      'กรุณาระบุเบอร์โทรศัพท์ผู้ร้อง (บังคับกรอกทุกกรณี รวมเรื่องปกปิดตัวตน)',
      400
    );
  }

  next();
};

module.exports = { validateComplaint };
