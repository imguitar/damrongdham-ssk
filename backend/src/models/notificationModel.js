'use strict';

const pool = require('../config/database');

const createBatch = async (records) => {
  if (!records.length) return;
  const now = new Date();
  const values = records.map(({ userId, complaintId, type, title, message }) => [
    userId, complaintId || null, type, title, message, 0, now,
  ]);
  await pool.query(
    `INSERT INTO notifications (user_id, complaint_id, type, title, message, is_read, created_at) VALUES ?`,
    [values]
  );
};

const findByUserId = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const offset = (page - 1) * limit;
  const cond = unreadOnly ? 'AND is_read = 0' : '';
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? ${cond}`,
    [userId]
  );
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ${cond} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return { rows, total };
};

const countUnread = async (userId) => {
  const [[{ cnt }]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return Number(cnt);
};

const markRead = async (id, userId) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ? AND is_read = 0',
    [id, userId]
  );
  return result.affectedRows > 0;
};

const markAllRead = async (userId) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return result.affectedRows;
};

module.exports = { createBatch, findByUserId, countUnread, markRead, markAllRead };
