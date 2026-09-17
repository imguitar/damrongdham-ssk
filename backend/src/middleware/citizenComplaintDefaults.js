'use strict';

const pool = require('../config/database');

// ฟอร์มประชาชน (public / citizen) ไม่ให้เลือกประเภทงานบริการ ลักษณะเรื่อง
// ช่องทางรับเรื่อง และความสำคัญ — เจ้าหน้าที่เป็นผู้กำหนดภายหลัง
// middleware นี้ใส่ค่าเริ่มต้นให้ก่อนผ่าน validateComplaint (คอลัมน์เป็น NOT NULL)

const WEB_CHANNEL_NAMES = ['SSK E-CMS', 'เว็บไซต์'];
const DEFAULT_SERVICE_TYPE = 'ทั่วไป';
const DEFAULT_NATURE = 'เรื่องร้องเรียนร้องทุกข์';

let cached = null;
let cachedAt = 0;
const TTL_MS = 10 * 60 * 1000;

// หา id ตามชื่อ (ตามลำดับที่ระบุ) — ไม่พบใช้แถว active แรก
const pickId = async (table, names) => {
  for (const name of names) {
    const [rows] = await pool.query(
      `SELECT id FROM ${table} WHERE name = ? AND is_active = 1 LIMIT 1`, [name]
    );
    if (rows[0]) return rows[0].id;
  }
  const [[fallback]] = await pool.query(`SELECT id FROM ${table} WHERE is_active = 1 ORDER BY id LIMIT 1`);
  return fallback ? fallback.id : null;
};

const loadDefaults = async () => {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  cached = {
    channel_id: await pickId('complaint_channels', WEB_CHANNEL_NAMES),
    service_type_id: await pickId('service_types', [DEFAULT_SERVICE_TYPE]),
    complaint_nature_id: await pickId('complaint_natures', [DEFAULT_NATURE]),
  };
  cachedAt = Date.now();
  return cached;
};

const applyCitizenComplaintDefaults = async (req, res, next) => {
  try {
    const defaults = await loadDefaults();
    // ประชาชนไม่มีสิทธิ์กำหนดเอง — ใช้ค่าเริ่มต้นเสมอ
    Object.assign(req.body, defaults, { priority: 'MEDIUM' });
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { applyCitizenComplaintDefaults };
