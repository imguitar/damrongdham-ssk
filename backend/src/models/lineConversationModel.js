'use strict';

const pool = require('../config/database');

// Conversation state for the LINE wizard. One row per LINE user.
// `draft` holds what the citizen has typed so far — temporary personal data that
// is deleted on submit / cancel / expiry (see lineConversationCleanupJob).

const parseJson = (v) => {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return null; }
};

const hydrate = (row) =>
  row ? { ...row, draft: parseJson(row.draft) || {}, context: parseJson(row.context) || {} } : null;

const findByLineUser = async (lineUserId) => {
  const [rows] = await pool.query('SELECT * FROM line_conversations WHERE line_user_id = ?', [lineUserId]);
  return hydrate(rows[0] || null);
};

// Create/update the session. TTL keeps abandoned drafts from living forever.
const save = async ({ lineUserId, citizenId, state, draft, context, ttlMinutes = 60 }) => {
  await pool.query(
    `INSERT INTO line_conversations (line_user_id, citizen_id, state, draft, context, last_event_at, expires_at)
     VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE))
     ON DUPLICATE KEY UPDATE
       citizen_id = VALUES(citizen_id),
       state      = VALUES(state),
       draft      = VALUES(draft),
       context    = VALUES(context),
       last_event_at = NOW(),
       expires_at = VALUES(expires_at)`,
    [
      lineUserId,
      citizenId || null,
      state,
      draft ? JSON.stringify(draft) : null,
      context ? JSON.stringify(context) : null,
      ttlMinutes,
    ]
  );
};

// Drop the draft (submitted / cancelled) but keep the identity binding row
const clear = async (lineUserId) => {
  await pool.query(
    `UPDATE line_conversations
     SET state = 'IDLE', draft = NULL, context = NULL, last_event_at = NOW(), expires_at = NULL
     WHERE line_user_id = ?`,
    [lineUserId]
  );
};

// Expired drafts are wiped (data minimisation) — returns affected rows
const expireStale = async () => {
  const [r] = await pool.query(
    `UPDATE line_conversations
     SET state = 'IDLE', draft = NULL, context = NULL, expires_at = NULL
     WHERE expires_at IS NOT NULL AND expires_at < NOW()`
  );
  return r.affectedRows;
};

// Remove long-idle rows entirely (no draft value left to keep)
const purgeIdle = async (days = 90) => {
  const [r] = await pool.query(
    `DELETE FROM line_conversations
     WHERE state = 'IDLE' AND draft IS NULL AND last_event_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  return r.affectedRows;
};

module.exports = { findByLineUser, save, clear, expireStale, purgeIdle };
