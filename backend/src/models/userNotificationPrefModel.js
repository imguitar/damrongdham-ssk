'use strict';

const pool = require('../config/database');

const PREF_COLUMNS = ['line_enabled', 'notify_new', 'notify_forwarded', 'notify_sla', 'notify_escalation'];

const createDefault = async (conn, userId) => {
  const q = conn || pool;
  await q.query(
    `INSERT INTO user_notification_preferences (user_id) VALUES (?)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId]
  );
};

const getByUser = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM user_notification_preferences WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

const update = async (userId, fields) => {
  const set = [];
  const vals = [];
  for (const col of PREF_COLUMNS) {
    if (fields[col] !== undefined) { set.push(`${col} = ?`); vals.push(fields[col] ? 1 : 0); }
  }
  if (!set.length) return;
  vals.push(userId);
  await pool.query(
    `UPDATE user_notification_preferences SET ${set.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
    vals
  );
};

module.exports = { PREF_COLUMNS, createDefault, getByUser, update };
