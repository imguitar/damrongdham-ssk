'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// บน production ต้องตั้ง JWT_SECRET เสมอ — ห้าม fallback เป็นค่าใน repo
// (ไม่งั้นผู้ที่เห็นซอร์สจะปลอม token เป็น super_admin ได้). fail fast ตอนบูต
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production — refusing to start with an insecure default');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const verifyPassword = (plainPassword, hash) => bcrypt.compare(plainPassword, hash);

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, 10);

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { verifyPassword, hashPassword, generateToken, verifyToken };
