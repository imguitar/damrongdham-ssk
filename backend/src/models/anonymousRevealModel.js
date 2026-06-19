'use strict';

const pool = require('../config/database');

const create = async ({ complaintId, revealedBy, reason }) => {
  const [result] = await pool.query(
    `INSERT INTO anonymous_reveal_logs (complaint_id, revealed_by, reason, created_at)
     VALUES (?, ?, ?, NOW())`,
    [complaintId, revealedBy, reason]
  );
  return result.insertId;
};

const findByComplaintId = async (complaintId) => {
  const [rows] = await pool.query(
    `SELECT arl.*, u.full_name AS revealed_by_name
     FROM anonymous_reveal_logs arl
     LEFT JOIN users u ON u.id = arl.revealed_by
     WHERE arl.complaint_id = ?
     ORDER BY arl.created_at DESC`,
    [complaintId]
  );
  return rows;
};

module.exports = { create, findByComplaintId };
