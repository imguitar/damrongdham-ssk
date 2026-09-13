'use strict';

const pool = require('../config/database');

const DEFAULT_ESCALATION_SETTINGS = Object.freeze({
  escalation_enabled: true,
  escalation_l1_days: 30,
  escalation_l2_offset_days: 15,
  escalation_l3_offset_days: 7,
});

const SETTING_META = {
  escalation_enabled: {
    valueType: 'BOOLEAN',
    description: 'เปิดหรือปิดระบบเร่งรัดการอัปเดตความคืบหน้า',
  },
  escalation_l1_days: {
    valueType: 'INT',
    description: 'จำนวนวันก่อนเร่งรัดระดับที่ 1',
  },
  escalation_l2_offset_days: {
    valueType: 'INT',
    description: 'จำนวนวันเพิ่มจากระดับที่ 1 ก่อนเร่งรัดระดับที่ 2',
  },
  escalation_l3_offset_days: {
    valueType: 'INT',
    description: 'จำนวนวันเพิ่มจากระดับที่ 2 ก่อนเร่งรัดระดับที่ 3',
  },
};

const withCumulativeThresholds = (settings) => ({
  ...settings,
  escalation_l2_days: settings.escalation_l1_days + settings.escalation_l2_offset_days,
  escalation_l3_days: settings.escalation_l1_days
    + settings.escalation_l2_offset_days
    + settings.escalation_l3_offset_days,
});

const parseStoredValue = (key, value) => {
  if (key === 'escalation_enabled') return value === 'true' || value === '1';
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_ESCALATION_SETTINGS[key];
};

const getEscalationSettings = async () => {
  let rows;
  try {
    [rows] = await pool.query(
      'SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?, ?, ?)',
      Object.keys(DEFAULT_ESCALATION_SETTINGS)
    );
  } catch (err) {
    // Keep scheduled jobs operational with safe defaults until migration 06 is applied.
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return withCumulativeThresholds({ ...DEFAULT_ESCALATION_SETTINGS });
    }
    throw err;
  }

  const settings = { ...DEFAULT_ESCALATION_SETTINGS };
  rows.forEach((row) => {
    if (Object.hasOwn(settings, row.setting_key)) {
      settings[row.setting_key] = parseStoredValue(row.setting_key, row.setting_value);
    }
  });
  return withCumulativeThresholds(settings);
};

const updateEscalationSettings = async (settings, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const [key, meta] of Object.entries(SETTING_META)) {
      await conn.query(
        `INSERT INTO system_settings
          (setting_key, setting_value, value_type, description, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value), value_type = VALUES(value_type),
          description = VALUES(description), updated_by = VALUES(updated_by), updated_at = NOW()`,
        [key, String(settings[key]), meta.valueType, meta.description, userId]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getEscalationSettings();
};

module.exports = {
  DEFAULT_ESCALATION_SETTINGS,
  getEscalationSettings,
  updateEscalationSettings,
};

