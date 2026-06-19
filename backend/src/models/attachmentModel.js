'use strict';

const pool = require('../config/database');

const create = async ({
  complaintId, updateId, fileName, filePath, fileSize, fileType,
  uploadedBy, uploadedByCitizen, uploadSource,
}) => {
  const [result] = await pool.query(
    `INSERT INTO complaint_attachments
       (complaint_id, update_id, file_name, file_path, file_size, file_type,
        uploaded_by, uploaded_by_citizen, upload_source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      complaintId,
      updateId || null,
      fileName,
      filePath,
      fileSize,
      fileType,
      uploadedBy || null,
      uploadedByCitizen || null,
      uploadSource || 'STAFF',
    ]
  );
  return result.insertId;
};

const findByComplaintId = async (complaintId) => {
  const [rows] = await pool.query(
    `SELECT ca.*, u.full_name AS uploaded_by_name
     FROM complaint_attachments ca
     LEFT JOIN users u ON u.id = ca.uploaded_by
     WHERE ca.complaint_id = ?
     ORDER BY ca.created_at DESC`,
    [complaintId]
  );
  return rows;
};

const findById = async (id) => {
  const [[row]] = await pool.query(
    'SELECT * FROM complaint_attachments WHERE id = ?',
    [id]
  );
  return row || null;
};

const remove = async (id) => {
  await pool.query('DELETE FROM complaint_attachments WHERE id = ?', [id]);
};

module.exports = { create, findByComplaintId, findById, remove };
