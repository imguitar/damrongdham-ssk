'use strict';

const settingModel = require('../models/settingModel');
const { success, error } = require('../utils/response');
const { writeAuditLog } = require('../middleware/auditLog');

const parseDay = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 365 ? parsed : null;
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingModel.getEscalationSettings();
    return success(res, { settings });
  } catch (err) { return next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const {
      escalation_enabled,
      escalation_l1_days,
      escalation_l2_offset_days,
      escalation_l3_offset_days,
    } = req.body;

    if (typeof escalation_enabled !== 'boolean') {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุสถานะเปิดหรือปิดการเร่งรัด', 400);
    }

    const l1Days = parseDay(escalation_l1_days);
    const l2OffsetDays = parseDay(escalation_l2_offset_days);
    const l3OffsetDays = parseDay(escalation_l3_offset_days);
    if (!l1Days || !l2OffsetDays || !l3OffsetDays) {
      return error(res, 'VALIDATION_ERROR', 'จำนวนวันแต่ละระดับต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 365 วัน', 400);
    }

    const before = await settingModel.getEscalationSettings();
    const settings = await settingModel.updateEscalationSettings({
      escalation_enabled,
      escalation_l1_days: l1Days,
      escalation_l2_offset_days: l2OffsetDays,
      escalation_l3_offset_days: l3OffsetDays,
    }, req.user.id);

    writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'system_settings',
      details: { group: 'escalation', before, after: settings },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { settings, message: 'บันทึกตั้งค่าการเร่งรัดสำเร็จ' });
  } catch (err) { return next(err); }
};

module.exports = { getSettings, updateSettings };

