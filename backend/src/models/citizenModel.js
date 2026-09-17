'use strict';

const pool = require('../config/database');

const findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM citizens WHERE email = ? AND is_active = 1',
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, email, full_name, phone, id_card, address,
            is_active, is_provisional, consent_at, last_login_at, created_at, updated_at,
            (password_hash IS NOT NULL) AS has_password
     FROM citizens WHERE id = ? AND is_active = 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ email, passwordHash, fullName, phone, idCard, address }) => {
  const [result] = await pool.query(
    `INSERT INTO citizens (email, password_hash, full_name, phone, id_card, address, consent_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [email, passwordHash, fullName, phone || null, idCard || null, address || null]
  );
  return result.insertId;
};

const getPasswordHash = async (id) => {
  const [rows] = await pool.query('SELECT password_hash FROM citizens WHERE id = ?', [id]);
  return rows[0]?.password_hash || null;
};

const updatePassword = async (id, passwordHash) => {
  await pool.query(
    'UPDATE citizens SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [passwordHash, id]
  );
};

const updateLastLogin = async (id) => {
  await pool.query('UPDATE citizens SET last_login_at = NOW() WHERE id = ?', [id]);
};

const updateProfile = async (id, { full_name, phone, id_card, address }) => {
  await pool.query(
    `UPDATE citizens SET full_name = ?, phone = ?, id_card = ?, address = ?, updated_at = NOW()
     WHERE id = ?`,
    [full_name, phone || null, id_card || null, address || null, id]
  );
};

// Add email + password to an account that has none (LINE-only) → enables email login
const setCredentials = async (id, { email, passwordHash }) => {
  await pool.query(
    'UPDATE citizens SET email = ?, password_hash = ?, updated_at = NOW() WHERE id = ?',
    [email, passwordHash, id]
  );
};

// Provisional (LINE) account completes registration: fill profile, record consent,
// and clear the provisional flag. Keeps existing email if none is provided.
const completeProfile = async (id, { full_name, phone, id_card, address, email }) => {
  await pool.query(
    `UPDATE citizens
     SET full_name = ?, phone = ?, id_card = ?, address = ?, email = COALESCE(?, email),
         is_provisional = 0, consent_at = COALESCE(consent_at, NOW()), updated_at = NOW()
     WHERE id = ?`,
    [full_name, phone || null, id_card || null, address || null, email || null, id]
  );
};

// บันทึกการยอมรับประกาศความเป็นส่วนตัว — เก็บเวลาครั้งแรกไว้ ไม่เขียนทับ
const recordConsent = async (id) => {
  await pool.query(
    'UPDATE citizens SET consent_at = NOW(), updated_at = NOW() WHERE id = ? AND consent_at IS NULL',
    [id]
  );
};

const hasConsent = async (id) => {
  const [[row]] = await pool.query('SELECT consent_at FROM citizens WHERE id = ?', [id]);
  return Boolean(row?.consent_at);
};

module.exports = {
  findByEmail, findById, create, getPasswordHash, updatePassword, updateLastLogin,
  updateProfile, completeProfile, setCredentials, recordConsent, hasConsent,
};
