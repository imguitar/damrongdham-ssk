'use strict';

const pool = require('../config/database');

// ── Pairing codes ─────────────────────────────────────────────────────────────
const createPairingCode = async ({ code, scope, agencyId, label, createdBy, expiresAt }) => {
  const [r] = await pool.query(
    `INSERT INTO line_group_pairing_codes (code, scope, agency_id, label, created_by, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [code, scope, agencyId || null, label || null, createdBy || null, expiresAt]
  );
  return r.insertId;
};

// find a still-valid (unused, unexpired) pairing code
const findValidPairingCode = async (code) => {
  const [rows] = await pool.query(
    `SELECT * FROM line_group_pairing_codes
     WHERE code = ? AND used_at IS NULL AND expires_at > NOW()`,
    [code]
  );
  return rows[0] || null;
};

const markPairingCodeUsed = async (id, groupId) => {
  await pool.query(
    'UPDATE line_group_pairing_codes SET used_at = NOW(), used_group_id = ? WHERE id = ?',
    [groupId, id]
  );
};

// ── Group targets ─────────────────────────────────────────────────────────────
const findTargetByGroup = async (groupId) => {
  const [rows] = await pool.query('SELECT * FROM line_group_targets WHERE group_id = ?', [groupId]);
  return rows[0] || null;
};

// bind (or re-bind) a group to a unit — idempotent on group_id
const upsertTarget = async ({ scope, agencyId, groupId, label, boundBy }) => {
  await pool.query(
    `INSERT INTO line_group_targets (scope, agency_id, group_id, label, is_active, bound_by, bound_at)
     VALUES (?, ?, ?, ?, 1, ?, NOW())
     ON DUPLICATE KEY UPDATE
       scope = VALUES(scope), agency_id = VALUES(agency_id), label = VALUES(label),
       is_active = 1, bound_by = VALUES(bound_by), bound_at = NOW()`,
    [scope, agencyId || null, groupId, label || null, boundBy || null]
  );
  return findTargetByGroup(groupId);
};

const disableTargetByGroup = async (groupId) => {
  const [r] = await pool.query(
    'UPDATE line_group_targets SET is_active = 0 WHERE group_id = ?',
    [groupId]
  );
  return r.affectedRows > 0;
};

const listTargets = async ({ agencyId } = {}) => {
  if (agencyId) {
    const [rows] = await pool.query(
      `SELECT t.*, a.name AS agency_name FROM line_group_targets t
       LEFT JOIN agencies a ON a.id = t.agency_id
       WHERE t.agency_id = ? ORDER BY t.id DESC`,
      [agencyId]
    );
    return rows;
  }
  const [rows] = await pool.query(
    `SELECT t.*, a.name AS agency_name FROM line_group_targets t
     LEFT JOIN agencies a ON a.id = t.agency_id ORDER BY t.id DESC`
  );
  return rows;
};

const getTargetById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM line_group_targets WHERE id = ?', [id]);
  return rows[0] || null;
};

const TOGGLE_COLUMNS = ['is_active', 'notify_new', 'notify_forwarded', 'notify_sla', 'notify_escalation'];
const updateTarget = async (id, fields) => {
  const set = [];
  const vals = [];
  for (const col of TOGGLE_COLUMNS) {
    if (fields[col] !== undefined) { set.push(`${col} = ?`); vals.push(fields[col] ? 1 : 0); }
  }
  if (!set.length) return;
  vals.push(id);
  await pool.query(`UPDATE line_group_targets SET ${set.join(', ')}, updated_at = NOW() WHERE id = ?`, vals);
};

const deleteTarget = async (id) => {
  const [r] = await pool.query('DELETE FROM line_group_targets WHERE id = ?', [id]);
  return r.affectedRows > 0;
};

module.exports = {
  TOGGLE_COLUMNS,
  createPairingCode, findValidPairingCode, markPairingCodeUsed,
  findTargetByGroup, upsertTarget, disableTargetByGroup,
  listTargets, getTargetById, updateTarget, deleteTarget,
};
