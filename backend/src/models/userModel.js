'use strict';

const pool = require('../config/database');

const findByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT u.*, r.code AS role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.username = ? AND u.is_active = 1`,
    [username]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone,
            u.role_id, u.agency_id, u.is_active, u.last_login_at, u.created_at,
            r.code AS role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ? AND u.is_active = 1`,
    [id]
  );
  return rows[0] || null;
};

const getPasswordHash = async (id) => {
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
  return rows[0]?.password_hash || null;
};

const updatePassword = async (id, passwordHash) => {
  await pool.query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [passwordHash, id]
  );
};

const updateLastLogin = async (id) => {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
};

module.exports = { findByUsername, findById, getPasswordHash, updatePassword, updateLastLogin };
