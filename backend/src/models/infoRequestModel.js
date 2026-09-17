'use strict';

const pool = require('../config/database');

// เจ้าหน้าที่ขอข้อมูล/เอกสารเพิ่มเติมจากผู้ร้อง + ข้อมูลที่ผู้ร้องส่งกลับ

const create = async ({ complaintId, requestedBy, message, dueDate }) => {
  const [r] = await pool.query(
    `INSERT INTO complaint_info_requests (complaint_id, requested_by, message, due_date)
     VALUES (?, ?, ?, ?)`,
    [complaintId, requestedBy, message, dueDate || null]
  );
  return r.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.complaint_number, c.citizen_id, u.full_name AS requested_by_name
     FROM complaint_info_requests r
     JOIN complaints c ON c.id = r.complaint_id
     LEFT JOIN users u ON u.id = r.requested_by
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const findByComplaint = async (complaintId) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.full_name AS requested_by_name,
            (SELECT COUNT(*) FROM complaint_info_responses ir WHERE ir.info_request_id = r.id) AS response_count
     FROM complaint_info_requests r
     LEFT JOIN users u ON u.id = r.requested_by
     WHERE r.complaint_id = ?
     ORDER BY r.created_at DESC`,
    [complaintId]
  );
  return rows;
};

// คำขอที่ยังรอคำตอบของ "เจ้าของเรื่อง" คนนี้เท่านั้น (ownership enforced in SQL)
const findPendingByCitizen = async (citizenId) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.complaint_number, c.tracking_code
     FROM complaint_info_requests r
     JOIN complaints c ON c.id = r.complaint_id
     WHERE c.citizen_id = ? AND r.status = 'PENDING'
     ORDER BY r.created_at ASC`,
    [citizenId]
  );
  return rows;
};

// โหลดคำขอพร้อมตรวจสิทธิ์ในคำสั่งเดียว — คืน null ถ้าไม่ใช่เรื่องของ citizen นี้
const findPendingForCitizen = async (id, citizenId) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.complaint_number, c.tracking_code, c.citizen_id
     FROM complaint_info_requests r
     JOIN complaints c ON c.id = r.complaint_id
     WHERE r.id = ? AND c.citizen_id = ? AND r.status = 'PENDING'`,
    [id, citizenId]
  );
  return rows[0] || null;
};

const markNotified = async (id) => {
  await pool.query(
    `UPDATE complaint_info_requests
     SET last_notified_at = NOW(), notify_count = notify_count + 1
     WHERE id = ?`,
    [id]
  );
};

const markResponded = async (id) => {
  const [r] = await pool.query(
    `UPDATE complaint_info_requests
     SET status = 'RESPONDED', responded_at = NOW()
     WHERE id = ? AND status = 'PENDING'`,
    [id]
  );
  return r.affectedRows > 0;
};

const cancel = async (id) => {
  const [r] = await pool.query(
    `UPDATE complaint_info_requests SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING'`,
    [id]
  );
  return r.affectedRows > 0;
};

// ── responses ────────────────────────────────────────────────────────────────
const addResponse = async ({ infoRequestId, complaintId, citizenId, message, attachmentId, channel = 'line' }) => {
  const [r] = await pool.query(
    `INSERT INTO complaint_info_responses (info_request_id, complaint_id, citizen_id, channel, message, attachment_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [infoRequestId, complaintId, citizenId || null, channel, message || null, attachmentId || null]
  );
  return r.insertId;
};

const findResponsesByComplaint = async (complaintId) => {
  const [rows] = await pool.query(
    `SELECT resp.*, a.file_name, a.file_size, a.file_type
     FROM complaint_info_responses resp
     LEFT JOIN complaint_attachments a ON a.id = resp.attachment_id
     WHERE resp.complaint_id = ?
     ORDER BY resp.created_at ASC`,
    [complaintId]
  );
  return rows;
};

const countResponses = async (infoRequestId) => {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) AS total FROM complaint_info_responses WHERE info_request_id = ?',
    [infoRequestId]
  );
  return row.total;
};

module.exports = {
  create, findById, findByComplaint, findPendingByCitizen, findPendingForCitizen,
  markNotified, markResponded, cancel,
  addResponse, findResponsesByComplaint, countResponses,
};
