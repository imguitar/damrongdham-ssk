'use strict';

const pool = require('../config/database');

const findByProvider = async (provider, providerUserId) => {
  const [rows] = await pool.query(
    'SELECT * FROM citizen_identities WHERE provider = ? AND provider_user_id = ?',
    [provider, providerUserId]
  );
  return rows[0] || null;
};

const findByCitizen = async (citizenId, provider) => {
  const [rows] = await pool.query(
    'SELECT * FROM citizen_identities WHERE citizen_id = ? AND provider = ?',
    [citizenId, provider]
  );
  return rows[0] || null;
};

// conn optional — pass a transaction connection to include in an atomic op
const create = async (conn, { citizenId, provider, providerUserId, displayName, pictureUrl }) => {
  const q = conn || pool;
  const [result] = await q.query(
    `INSERT INTO citizen_identities (citizen_id, provider, provider_user_id, display_name, picture_url)
     VALUES (?, ?, ?, ?, ?)`,
    [citizenId, provider, providerUserId, displayName || null, pictureUrl || null]
  );
  return result.insertId;
};

// Refresh UX-only display metadata (never used for identity)
const touchProfile = async (id, { displayName, pictureUrl }) => {
  await pool.query(
    'UPDATE citizen_identities SET display_name = ?, picture_url = ?, updated_at = NOW() WHERE id = ?',
    [displayName || null, pictureUrl || null, id]
  );
};

module.exports = { findByProvider, findByCitizen, create, touchProfile };
