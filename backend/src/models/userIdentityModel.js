'use strict';

const pool = require('../config/database');

const findByProvider = async (provider, providerUserId) => {
  const [rows] = await pool.query(
    'SELECT * FROM user_identities WHERE provider = ? AND provider_user_id = ?',
    [provider, providerUserId]
  );
  return rows[0] || null;
};

const findByUser = async (userId, provider) => {
  const [rows] = await pool.query(
    'SELECT * FROM user_identities WHERE user_id = ? AND provider = ?',
    [userId, provider]
  );
  return rows[0] || null;
};

const create = async (conn, { userId, provider, providerUserId, displayName, pictureUrl }) => {
  const q = conn || pool;
  const [result] = await q.query(
    `INSERT INTO user_identities (user_id, provider, provider_user_id, display_name, picture_url)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, provider, providerUserId, displayName || null, pictureUrl || null]
  );
  return result.insertId;
};

const touchProfile = async (id, { displayName, pictureUrl }) => {
  await pool.query(
    'UPDATE user_identities SET display_name = ?, picture_url = ?, updated_at = NOW() WHERE id = ?',
    [displayName || null, pictureUrl || null, id]
  );
};

const deleteByUser = async (userId, provider) => {
  const [r] = await pool.query(
    'DELETE FROM user_identities WHERE user_id = ? AND provider = ?',
    [userId, provider]
  );
  return r.affectedRows > 0;
};

module.exports = { findByProvider, findByUser, create, touchProfile, deleteByUser };
