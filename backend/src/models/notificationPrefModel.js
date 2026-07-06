'use strict';

const pool = require('../config/database');

const PREF_COLUMNS = [
  'line_enabled',
  'notify_status_change',
  'notify_progress_update',
  'notify_more_info_required',
  'notify_resolved',
  'notify_closed',
];

// Create default preference row (all ON). conn optional for transactional use.
const createDefault = async (conn, citizenId) => {
  const q = conn || pool;
  await q.query(
    `INSERT INTO notification_preferences (citizen_id) VALUES (?)
     ON DUPLICATE KEY UPDATE citizen_id = citizen_id`,
    [citizenId]
  );
};

const getByCitizen = async (citizenId) => {
  const [rows] = await pool.query(
    'SELECT * FROM notification_preferences WHERE citizen_id = ?',
    [citizenId]
  );
  return rows[0] || null;
};

// Partial update — only whitelisted boolean columns
const update = async (citizenId, fields) => {
  const setClauses = [];
  const values = [];
  for (const col of PREF_COLUMNS) {
    if (fields[col] !== undefined) {
      setClauses.push(`${col} = ?`);
      values.push(fields[col] ? 1 : 0);
    }
  }
  if (!setClauses.length) return;
  values.push(citizenId);
  await pool.query(
    `UPDATE notification_preferences SET ${setClauses.join(', ')}, updated_at = NOW() WHERE citizen_id = ?`,
    values
  );
};

module.exports = { PREF_COLUMNS, createDefault, getByCitizen, update };
