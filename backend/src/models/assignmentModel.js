'use strict';

const pool = require('../config/database');

const findById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT ca.*,
            a.name     AS agency_name,
            a.is_center AS is_center,
            u.full_name  AS assigned_by_name,
            ua.full_name AS accepted_by_name
     FROM complaint_assignments ca
     LEFT JOIN agencies a  ON a.id  = ca.agency_id
     LEFT JOIN users u     ON u.id  = ca.assigned_by
     LEFT JOIN users ua    ON ua.id = ca.accepted_by
     WHERE ca.id = ?`,
    [id]
  );
  return row || null;
};

const findByComplaintId = async (complaintId) => {
  const [rows] = await pool.query(
    `SELECT ca.*,
            a.name      AS agency_name,
            a.is_center AS is_center,
            u.full_name  AS assigned_by_name,
            ua.full_name AS accepted_by_name
     FROM complaint_assignments ca
     LEFT JOIN agencies a  ON a.id  = ca.agency_id
     LEFT JOIN users u     ON u.id  = ca.assigned_by
     LEFT JOIN users ua    ON ua.id = ca.accepted_by
     WHERE ca.complaint_id = ?
     ORDER BY ca.created_at DESC`,
    [complaintId]
  );
  return rows;
};

const findActiveByComplaintId = async (complaintId) => {
  const [[row]] = await pool.query(
    `SELECT ca.*, a.name AS agency_name, a.is_center AS is_center
     FROM complaint_assignments ca
     LEFT JOIN agencies a ON a.id = ca.agency_id
     WHERE ca.complaint_id = ? AND ca.is_active = 1
     LIMIT 1`,
    [complaintId]
  );
  return row || null;
};

// Must be called inside a transaction
const accept = async (conn, id, acceptedBy) => {
  await conn.query(
    `UPDATE complaint_assignments
     SET status = 'ACCEPTED', accepted_by = ?, accepted_at = NOW(), updated_at = NOW()
     WHERE id = ? AND status = 'PENDING'`,
    [acceptedBy, id]
  );
};

const setReturned = async (conn, id, returnReason) => {
  await conn.query(
    `UPDATE complaint_assignments
     SET status = 'RETURNED', return_reason = ?, returned_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [returnReason, id]
  );
};

module.exports = { findById, findByComplaintId, findActiveByComplaintId, accept, setReturned };
