'use strict';

const pool = require('../config/database');

// การจัดการบัญชีประชาชนโดยผู้ดูแลระบบสูงสุด (super_admin) — แยกจากบัญชีเจ้าหน้าที่ (users)

const LIST_FIELDS = `
  c.id, c.email, c.full_name, c.phone, c.id_card,
  c.is_active, c.is_provisional, c.consent_at, c.last_login_at, c.created_at, c.updated_at,
  (c.password_hash IS NOT NULL) AS has_password,
  EXISTS (SELECT 1 FROM citizen_identities ci WHERE ci.citizen_id = c.id AND ci.provider = 'line') AS line_linked,
  (SELECT COUNT(*) FROM complaints cp WHERE cp.citizen_id = c.id) AS complaint_count
`;

const findAll = async ({ search, isActive, loginType, limit = 20, offset = 0 }) => {
  const where = [];
  const params = [];

  if (search) {
    const like = `%${search}%`;
    where.push('(c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.id_card LIKE ?)');
    params.push(like, like, like, like);
  }
  if (isActive !== undefined) {
    where.push('c.is_active = ?');
    params.push(isActive ? 1 : 0);
  }
  if (loginType === 'line') {
    where.push("EXISTS (SELECT 1 FROM citizen_identities ci WHERE ci.citizen_id = c.id AND ci.provider = 'line')");
  } else if (loginType === 'email') {
    where.push('c.password_hash IS NOT NULL');
  } else if (loginType === 'provisional') {
    where.push('c.is_provisional = 1');
  }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM citizens c ${whereStr}`, params);
  const [rows] = await pool.query(
    `SELECT ${LIST_FIELDS} FROM citizens c ${whereStr}
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { rows, total };
};

const findById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT ${LIST_FIELDS}, c.address FROM citizens c WHERE c.id = ?`,
    [id]
  );
  if (!row) return null;

  const [identities] = await pool.query(
    `SELECT provider, display_name, picture_url, linked_at
     FROM citizen_identities WHERE citizen_id = ? ORDER BY linked_at`,
    [id]
  );
  const [complaints] = await pool.query(
    `SELECT id, complaint_number, tracking_code, title, status, created_at
     FROM complaints WHERE citizen_id = ?
     ORDER BY created_at DESC LIMIT 50`,
    [id]
  );
  return { ...row, identities, complaints };
};

const updateProfile = async (id, { full_name, phone, id_card, address }) => {
  const [result] = await pool.query(
    `UPDATE citizens SET full_name = ?, phone = ?, id_card = ?, address = ?, updated_at = NOW()
     WHERE id = ?`,
    [full_name, phone || null, id_card || null, address || null, id]
  );
  return result.affectedRows > 0;
};

const setActive = async (id, isActive) => {
  const [result] = await pool.query(
    'UPDATE citizens SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, updateProfile, setActive };
