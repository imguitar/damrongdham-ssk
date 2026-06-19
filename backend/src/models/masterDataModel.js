'use strict';

const pool = require('../config/database');

// ============================================================
// complaint_categories
// ============================================================
const findAllCategories = async (activeOnly = false) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.query(
    `SELECT * FROM complaint_categories ${where} ORDER BY name`
  );
  return rows;
};

const findCategoryById = async (id) => {
  const [[row]] = await pool.query(
    'SELECT * FROM complaint_categories WHERE id = ?',
    [id]
  );
  return row || null;
};

const createCategory = async ({ name, description, slaDays }) => {
  const [result] = await pool.query(
    `INSERT INTO complaint_categories (name, description, sla_days, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, NOW(), NOW())`,
    [name, description || null, slaDays]
  );
  return result.insertId;
};

const updateCategory = async (id, { name, description, slaDays }) => {
  await pool.query(
    `UPDATE complaint_categories SET name = ?, description = ?, sla_days = ?, updated_at = NOW()
     WHERE id = ?`,
    [name, description || null, slaDays, id]
  );
};

const toggleCategoryStatus = async (id, isActive) => {
  await pool.query(
    'UPDATE complaint_categories SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
};

// ============================================================
// complaint_channels
// ============================================================
const findAllChannels = async (activeOnly = false) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.query(
    `SELECT * FROM complaint_channels ${where} ORDER BY name`
  );
  return rows;
};

const findChannelById = async (id) => {
  const [[row]] = await pool.query(
    'SELECT * FROM complaint_channels WHERE id = ?',
    [id]
  );
  return row || null;
};

const createChannel = async ({ name }) => {
  const [result] = await pool.query(
    `INSERT INTO complaint_channels (name, is_active, created_at, updated_at)
     VALUES (?, 1, NOW(), NOW())`,
    [name]
  );
  return result.insertId;
};

const updateChannel = async (id, { name }) => {
  await pool.query(
    'UPDATE complaint_channels SET name = ?, updated_at = NOW() WHERE id = ?',
    [name, id]
  );
};

const toggleChannelStatus = async (id, isActive) => {
  await pool.query(
    'UPDATE complaint_channels SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
};

// ============================================================
// provinces
// ============================================================
const findAllProvinces = async (activeOnly = false) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.query(
    `SELECT * FROM provinces ${where} ORDER BY name`
  );
  return rows;
};

const findProvinceById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM provinces WHERE id = ?', [id]);
  return row || null;
};

const createProvince = async ({ name, code }) => {
  const [result] = await pool.query(
    `INSERT INTO provinces (name, code, is_active, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())`,
    [name, code || null]
  );
  return result.insertId;
};

const updateProvince = async (id, { name, code }) => {
  await pool.query(
    'UPDATE provinces SET name = ?, code = ?, updated_at = NOW() WHERE id = ?',
    [name, code || null, id]
  );
};

// ============================================================
// districts
// ============================================================
const findAllDistricts = async (provinceId = null, activeOnly = false) => {
  const conditions = [];
  const params = [];
  if (activeOnly) { conditions.push('is_active = 1'); }
  if (provinceId) { conditions.push('province_id = ?'); params.push(parseInt(provinceId)); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM districts ${where} ORDER BY name`,
    params
  );
  return rows;
};

const findDistrictById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM districts WHERE id = ?', [id]);
  return row || null;
};

const createDistrict = async ({ name, code, provinceId }) => {
  const [result] = await pool.query(
    `INSERT INTO districts (name, code, province_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, NOW(), NOW())`,
    [name, code || null, provinceId]
  );
  return result.insertId;
};

const updateDistrict = async (id, { name, code, provinceId }) => {
  await pool.query(
    'UPDATE districts SET name = ?, code = ?, province_id = ?, updated_at = NOW() WHERE id = ?',
    [name, code || null, provinceId, id]
  );
};

// ============================================================
// subdistricts
// ============================================================
const findSubdistrictsByDistrictId = async (districtId, activeOnly = false) => {
  const where = activeOnly ? 'WHERE district_id = ? AND is_active = 1' : 'WHERE district_id = ?';
  const [rows] = await pool.query(
    `SELECT * FROM subdistricts ${where} ORDER BY name`,
    [districtId]
  );
  return rows;
};

const createSubdistrict = async ({ name, code, districtId }) => {
  const [result] = await pool.query(
    `INSERT INTO subdistricts (name, code, district_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, NOW(), NOW())`,
    [name, code || null, districtId]
  );
  return result.insertId;
};

const updateSubdistrict = async (id, { name, code }) => {
  await pool.query(
    'UPDATE subdistricts SET name = ?, code = ?, updated_at = NOW() WHERE id = ?',
    [name, code || null, id]
  );
};

// ============================================================
// service_types
// ============================================================
const findAllServiceTypes = async (activeOnly = false) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.query(
    `SELECT * FROM service_types ${where} ORDER BY name`
  );
  return rows;
};

const createServiceType = async ({ name, description }) => {
  const [result] = await pool.query(
    `INSERT INTO service_types (name, description, is_active, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())`,
    [name, description || null]
  );
  return result.insertId;
};

const updateServiceType = async (id, { name, description }) => {
  await pool.query(
    'UPDATE service_types SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
    [name, description || null, id]
  );
};

const toggleServiceTypeStatus = async (id, isActive) => {
  await pool.query(
    'UPDATE service_types SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
};

// ============================================================
// complaint_natures
// ============================================================
const findAllComplaintNatures = async (activeOnly = false) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.query(
    `SELECT * FROM complaint_natures ${where} ORDER BY name`
  );
  return rows;
};

const createComplaintNature = async ({ name, description }) => {
  const [result] = await pool.query(
    `INSERT INTO complaint_natures (name, description, is_active, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())`,
    [name, description || null]
  );
  return result.insertId;
};

const updateComplaintNature = async (id, { name, description }) => {
  await pool.query(
    'UPDATE complaint_natures SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
    [name, description || null, id]
  );
};

const toggleComplaintNatureStatus = async (id, isActive) => {
  await pool.query(
    'UPDATE complaint_natures SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
};

// ============================================================
// complainant_types
// ============================================================
const findAllComplainantTypes = async (activeOnly = false) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.query(
    `SELECT * FROM complainant_types ${where} ORDER BY name`
  );
  return rows;
};

const createComplainantType = async ({ name }) => {
  const [result] = await pool.query(
    `INSERT INTO complainant_types (name, is_active, created_at, updated_at)
     VALUES (?, 1, NOW(), NOW())`,
    [name]
  );
  return result.insertId;
};

const updateComplainantType = async (id, { name }) => {
  await pool.query(
    'UPDATE complainant_types SET name = ?, updated_at = NOW() WHERE id = ?',
    [name, id]
  );
};

const toggleComplainantTypeStatus = async (id, isActive) => {
  await pool.query(
    'UPDATE complainant_types SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
};

module.exports = {
  // categories
  findAllCategories, findCategoryById, createCategory, updateCategory, toggleCategoryStatus,
  // channels
  findAllChannels, findChannelById, createChannel, updateChannel, toggleChannelStatus,
  // provinces
  findAllProvinces, findProvinceById, createProvince, updateProvince,
  // districts
  findAllDistricts, findDistrictById, createDistrict, updateDistrict,
  // subdistricts
  findSubdistrictsByDistrictId, createSubdistrict, updateSubdistrict,
  // service_types
  findAllServiceTypes, createServiceType, updateServiceType, toggleServiceTypeStatus,
  // complaint_natures
  findAllComplaintNatures, createComplaintNature, updateComplaintNature, toggleComplaintNatureStatus,
  // complainant_types
  findAllComplainantTypes, createComplainantType, updateComplainantType, toggleComplainantTypeStatus,
};
