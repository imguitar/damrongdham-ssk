'use strict';

const pool = require('../config/database');

// conn optional — pass a transaction connection to include in an atomic op
const create = async ({ complaintId, assignmentId, updateType, content, updatedBy, isPublic }, conn) => {
  const q = conn || pool;
  const [result] = await q.query(
    `INSERT INTO complaint_updates (complaint_id, assignment_id, update_type, content, is_public, updated_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [complaintId, assignmentId || null, updateType, content, isPublic ? 1 : 0, updatedBy]
  );
  return result.insertId;
};

module.exports = { create };
