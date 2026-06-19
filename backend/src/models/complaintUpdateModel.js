'use strict';

const pool = require('../config/database');

const create = async ({ complaintId, assignmentId, updateType, content, updatedBy }) => {
  const [result] = await pool.query(
    `INSERT INTO complaint_updates (complaint_id, assignment_id, update_type, content, updated_by, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [complaintId, assignmentId || null, updateType, content, updatedBy]
  );
  return result.insertId;
};

module.exports = { create };
