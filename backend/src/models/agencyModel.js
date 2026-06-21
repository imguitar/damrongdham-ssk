'use strict';

const pool = require('../config/database');

const findAll = async (includeInactive = false) => {
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  const [rows] = await pool.query(
    `SELECT id, name, short_name, contact_phone, contact_email, address, is_active, is_center, created_at, updated_at
     FROM agencies ${where} ORDER BY is_center DESC, name ASC`
  );
  return rows;
};

const findById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM agencies WHERE id = ?', [id]);
  return row || null;
};

const findCenter = async () => {
  const [[row]] = await pool.query('SELECT * FROM agencies WHERE is_center = 1 AND is_active = 1 LIMIT 1');
  return row || null;
};

const create = async ({ name, short_name, contact_phone, contact_email, address }) => {
  const [result] = await pool.query(
    `INSERT INTO agencies (name, short_name, contact_phone, contact_email, address, is_active, is_center, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, 0, NOW(), NOW())`,
    [name, short_name || null, contact_phone || null, contact_email || null, address || null]
  );
  return result.insertId;
};

const update = async (id, { name, short_name, contact_phone, contact_email, address }) => {
  await pool.query(
    `UPDATE agencies
     SET name = ?, short_name = ?, contact_phone = ?, contact_email = ?, address = ?, updated_at = NOW()
     WHERE id = ?`,
    [name, short_name || null, contact_phone || null, contact_email || null, address || null, id]
  );
};

const toggleStatus = async (id) => {
  const [[agency]] = await pool.query('SELECT is_active, is_center FROM agencies WHERE id = ?', [id]);
  if (!agency) return null;
  if (agency.is_center) return agency.is_active; // prevent disabling center agency
  const next = agency.is_active ? 0 : 1;
  await pool.query('UPDATE agencies SET is_active = ?, updated_at = NOW() WHERE id = ?', [next, id]);
  return next;
};

module.exports = { findAll, findById, findCenter, create, update, toggleStatus };
