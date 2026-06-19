'use strict';

const pool = require('../config/database');

const findAll = async (includeInactive = false) => {
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  const [rows] = await pool.query(
    `SELECT id, name, short_name, contact_phone, contact_email, address, is_active, created_at, updated_at
     FROM agencies ${where} ORDER BY name ASC`
  );
  return rows;
};

const findById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM agencies WHERE id = ?', [id]);
  return row || null;
};

const create = async ({ name, short_name, contact_phone, contact_email, address }) => {
  const [result] = await pool.query(
    `INSERT INTO agencies (name, short_name, contact_phone, contact_email, address, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
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
  const [[agency]] = await pool.query('SELECT is_active FROM agencies WHERE id = ?', [id]);
  if (!agency) return null;
  const next = agency.is_active ? 0 : 1;
  await pool.query('UPDATE agencies SET is_active = ?, updated_at = NOW() WHERE id = ?', [next, id]);
  return next;
};

module.exports = { findAll, findById, create, update, toggleStatus };
