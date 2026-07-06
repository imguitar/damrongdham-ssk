'use strict';
// Shared helpers for DB-backed integration/security tests.
// Requires a MySQL DB with db/init schema+seed loaded (dev DB works; CI must load it).
// All fixtures are prefixed ITEST so they can be cleaned up safely.

import pool from '../../src/config/database.js';

export { pool };

// true if the DB is reachable — lets test files skip cleanly when it isn't
export const dbAvailable = async () => {
  try {
    const c = await pool.getConnection();
    await c.query('SELECT 1');
    c.release();
    return true;
  } catch {
    return false;
  }
};

let counter = 0;
const uniqSuffix = () => `${Date.now().toString().slice(-8)}${(counter++).toString().padStart(2, '0')}`;

// cache seed FK ids (master data + a staff user)
let cachedRefs = null;
export const refs = async () => {
  if (cachedRefs) return cachedRefs;
  const one = async (t) => (await pool.query(`SELECT id FROM ${t} LIMIT 1`))[0][0].id;
  cachedRefs = {
    ct: await one('complainant_types'),
    st: await one('service_types'),
    cn: await one('complaint_natures'),
    ch: await one('complaint_channels'),
    userId: await one('users'),
  };
  return cachedRefs;
};

export const createCitizen = async ({ provisional = 0, active = 1, lineSub = null } = {}) => {
  const [r] = await pool.query(
    'INSERT INTO citizens (full_name, is_active, is_provisional) VALUES (?, ?, ?)',
    [`ITEST_${uniqSuffix()}`, active, provisional]
  );
  const id = r.insertId;
  if (lineSub) {
    await pool.query(
      'INSERT INTO citizen_identities (citizen_id, provider, provider_user_id) VALUES (?, "line", ?)',
      [id, lineSub]
    );
  }
  return id;
};

export const createComplaint = async ({ citizenId = null, status = 'NEW' } = {}) => {
  const r = await refs();
  const number = `ITEST-${uniqSuffix()}`; // <= 20 chars
  const [res] = await pool.query(
    `INSERT INTO complaints (complaint_number, title, description, complainant_type_id, complainant_phone,
       service_type_id, complaint_nature_id, channel_id, citizen_id, status, source)
     VALUES (?, 'itest', 'desc', ?, '0800000000', ?, ?, ?, ?, ?, ?)`,
    [number, r.ct, r.st, r.cn, r.ch, citizenId, status, citizenId ? 'PUBLIC' : 'STAFF']
  );
  return { id: res.insertId, number };
};

export const getOutbox = async (complaintId) => {
  const [rows] = await pool.query('SELECT * FROM notification_outbox WHERE complaint_id = ?', [complaintId]);
  return rows;
};
export const getLogs = async (complaintId) => {
  const [rows] = await pool.query('SELECT * FROM notification_logs WHERE complaint_id = ?', [complaintId]);
  return rows;
};

export const cleanupComplaint = async (complaintId) => {
  await pool.query('DELETE FROM notification_logs WHERE complaint_id = ?', [complaintId]);
  await pool.query('DELETE FROM notification_outbox WHERE complaint_id = ?', [complaintId]);
  await pool.query('DELETE FROM complaint_status_logs WHERE complaint_id = ?', [complaintId]);
  await pool.query('DELETE FROM complaint_updates WHERE complaint_id = ?', [complaintId]);
  await pool.query('DELETE FROM complaint_assignments WHERE complaint_id = ?', [complaintId]);
  await pool.query('DELETE FROM complaints WHERE id = ?', [complaintId]);
};

export const cleanupCitizen = async (citizenId) => {
  const [cs] = await pool.query('SELECT id FROM complaints WHERE citizen_id = ?', [citizenId]);
  for (const c of cs) await cleanupComplaint(c.id);
  await pool.query('DELETE FROM notification_logs WHERE citizen_id = ?', [citizenId]);
  await pool.query('DELETE FROM notification_outbox WHERE citizen_id = ?', [citizenId]);
  await pool.query('DELETE FROM notification_preferences WHERE citizen_id = ?', [citizenId]);
  await pool.query('DELETE FROM citizen_identities WHERE citizen_id = ?', [citizenId]);
  await pool.query('DELETE FROM citizens WHERE id = ?', [citizenId]);
};
