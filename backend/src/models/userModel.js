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

// ── User Management (admin CRUD) ───────────────────────────────────────────────

const findAll = async ({ search, roleId, agencyId, isActive, limit = 20, offset = 0 } = {}) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (roleId) { conditions.push('u.role_id = ?'); params.push(parseInt(roleId)); }
  if (agencyId) { conditions.push('u.agency_id = ?'); params.push(parseInt(agencyId)); }
  if (isActive !== undefined) { conditions.push('u.is_active = ?'); params.push(isActive ? 1 : 0); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone,
            u.role_id, u.agency_id, u.is_active, u.last_login_at, u.created_at, u.updated_at,
            r.code AS role_code, r.name AS role_name,
            a.name AS agency_name
     FROM users u
     JOIN roles r    ON r.id = u.role_id
     LEFT JOIN agencies a ON a.id = u.agency_id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total };
};

// Returns user regardless of is_active (for admin management)
const findUserById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone,
            u.role_id, u.agency_id, u.is_active, u.last_login_at, u.created_at, u.updated_at,
            r.code AS role_code, r.name AS role_name,
            a.name AS agency_name
     FROM users u
     JOIN roles r    ON r.id = u.role_id
     LEFT JOIN agencies a ON a.id = u.agency_id
     WHERE u.id = ?`,
    [id]
  );
  return row || null;
};

const createUser = async ({ username, passwordHash, fullName, email, phone, roleId, agencyId }) => {
  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash, full_name, email, phone, role_id, agency_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [username, passwordHash, fullName, email || null, phone || null, roleId, agencyId || null]
  );
  return result.insertId;
};

const updateUser = async (id, { fullName, email, phone, roleId, agencyId }) => {
  await pool.query(
    `UPDATE users SET full_name = ?, email = ?, phone = ?, role_id = ?, agency_id = ?, updated_at = NOW()
     WHERE id = ?`,
    [fullName, email || null, phone || null, roleId, agencyId || null, id]
  );
};

const toggleUserStatus = async (id) => {
  const [[user]] = await pool.query('SELECT is_active FROM users WHERE id = ?', [id]);
  if (!user) return null;
  const next = user.is_active ? 0 : 1;
  await pool.query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [next, id]);
  return next;
};

module.exports = {
  findByUsername, findById, getPasswordHash, updatePassword, updateLastLogin,
  findAll, findUserById, createUser, updateUser, toggleUserStatus,
};
