'use strict';

const crypto = require('crypto');

// รหัสติดตามเรื่องสำหรับประชาชน — สุ่ม 4 ตัว ไม่เรียงลำดับ เดาต่อจากรหัสอื่นไม่ได้
// ตัดตัวที่สับสนง่ายออก (0/O, 1/I/L) → 31^4 ≈ 923,521 รูปแบบ
// เพราะพื้นที่รหัสเล็ก ปลายทางค้นหาด้วยรหัสต้องจำกัดอัตรา (rate limit) เสมอ
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 4;

const generateTrackingCode = () => {
  let code = '';
  for (let i = 0; i < LENGTH; i += 1) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return code;
};

// ตัดช่องว่าง/ขีด + ตัวพิมพ์ใหญ่ — คืน null ถ้ารูปแบบไม่ถูกต้อง
const normalizeTrackingCode = (value) => {
  const code = String(value ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (code.length !== LENGTH) return null;
  for (const ch of code) if (!ALPHABET.includes(ch)) return null;
  return code;
};

const isTrackingCodeConflict = (err) =>
  err?.code === 'ER_DUP_ENTRY' && String(err.message).includes('tracking_code');

module.exports = { ALPHABET, LENGTH, generateTrackingCode, normalizeTrackingCode, isTrackingCodeConflict };
