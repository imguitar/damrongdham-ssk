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
            is_active, last_login_at, created_at, updated_at
     FROM citizens WHERE id = ? AND is_active = 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ email, passwordHash, fullName, phone, idCard, address }) => {
  const [result] = await pool.query(
    `INSERT INTO citizens (email, password_hash, full_name, phone, id_card, address)
     VALUES (?, ?, ?, ?, ?, ?)`,
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

module.exports = { findByEmail, findById, create, getPasswordHash, updatePassword, updateLastLogin, updateProfile };
