'use strict';

const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { parsePagination, paginationMeta } = require('../utils/pagination');

// ─── GET /api/audit-logs ──────────────────────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { user_id, action, resource, date_from, date_to } = req.query;

    const where = [];
    const vals = [];

    if (user_id)   { where.push('al.user_id = ?');    vals.push(Number(user_id)); }
    if (action)    { where.push('al.action LIKE ?');   vals.push(`%${action}%`); }
    if (resource)  { where.push('al.resource = ?');    vals.push(resource); }
    if (date_from) { where.push('al.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)   { where.push('al.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`,
      vals
    );

    const [rows] = await pool.query(
      `SELECT al.id, al.action, al.resource, al.resource_id,
        al.ip_address, al.created_at,
        u.id AS user_id, u.username, u.full_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return success(res, { logs: rows, pagination: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// ─── GET /api/audit-logs/:id ──────────────────────────────────────────────────
const getById = async (req, res, next) => {
  try {
    const [[row]] = await pool.query(
      `SELECT al.*, u.username, u.full_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.id = ?`,
      [req.params.id]
    );
    if (!row) return error(res, 'NOT_FOUND', 'ไม่พบ Audit Log', 404);
    return success(res, { log: row });
  } catch (err) { next(err); }
};

module.exports = { list, getById };
