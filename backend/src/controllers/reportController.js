'use strict';

const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { parsePagination, paginationMeta } = require('../utils/pagination');
const { createExcelReport } = require('../services/reportService');

const ALLOWED_EXPORT_TYPES = ['monthly', 'by-category', 'by-agency', 'overdue'];

// ─── helpers ──────────────────────────────────────────────────────────────────

const toNum = (v) => Number(v || 0);

const addDateWhere = (where, vals, date_from, date_to, alias = 'c') => {
  if (date_from) { where.push(`${alias}.created_at >= ?`); vals.push(`${date_from} 00:00:00`); }
  if (date_to)   { where.push(`${alias}.created_at <= ?`); vals.push(`${date_to} 23:59:59`); }
};

// ─── GET /api/reports/monthly ─────────────────────────────────────────────────
// Returns monthly aggregate grouped by year+month for the given year
const monthly = async (req, res, next) => {
  try {
    const { year, month, date_from, date_to, agency_id, category_id } = req.query;
    const vals = [];
    const where = [];

    if (year)       { where.push('YEAR(c.created_at) = ?');  vals.push(Number(year)); }
    if (month)      { where.push('MONTH(c.created_at) = ?'); vals.push(Number(month)); }
    if (date_from)  { where.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)    { where.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (category_id){ where.push('c.category_id = ?'); vals.push(Number(category_id)); }

    let sql = `SELECT YEAR(c.created_at) AS year, MONTH(c.created_at) AS month,
      COUNT(*) AS total,
      SUM(c.status = 'CLOSED') AS closed,
      SUM(c.status NOT IN ('CLOSED','REJECTED')) AS active,
      SUM(c.is_overdue = 1) AS overdue,
      SUM(c.priority = 'HIGH') AS cnt_high,
      SUM(c.priority = 'MEDIUM') AS cnt_medium,
      SUM(c.priority = 'LOW') AS cnt_low
    FROM complaints c`;

    if (agency_id) {
      sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
      vals.unshift(Number(agency_id));
    }

    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' GROUP BY YEAR(c.created_at), MONTH(c.created_at) ORDER BY year, month';

    const [rows] = await pool.query(sql, vals);
    const result = rows.map(r => ({
      year: toNum(r.year), month: toNum(r.month),
      total: toNum(r.total), closed: toNum(r.closed),
      active: toNum(r.active), overdue: toNum(r.overdue),
      high_priority: toNum(r.cnt_high),
      medium_priority: toNum(r.cnt_medium),
      low_priority: toNum(r.cnt_low),
    }));

    return success(res, { report: result });
  } catch (err) { next(err); }
};

// ─── GET /api/reports/by-category ─────────────────────────────────────────────
const byCategory = async (req, res, next) => {
  try {
    const { date_from, date_to, agency_id } = req.query;
    const vals = [];

    const cOn = ['c.category_id = cc.id'];
    if (date_from) { cOn.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)   { cOn.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (agency_id) {
      cOn.push('c.id IN (SELECT complaint_id FROM complaint_assignments WHERE agency_id = ? AND is_active = 1)');
      vals.push(Number(agency_id));
    }

    const sql = `SELECT cc.id, cc.name, cc.sla_days,
      COUNT(c.id) AS total,
      COALESCE(SUM(c.status = 'CLOSED'), 0) AS closed,
      COALESCE(SUM(c.status NOT IN ('CLOSED','REJECTED')), 0) AS active,
      COALESCE(SUM(c.is_overdue = 1), 0) AS overdue,
      COALESCE(SUM(c.priority = 'HIGH'), 0) AS cnt_high
    FROM complaint_categories cc
    LEFT JOIN complaints c ON ${cOn.join(' AND ')}
    WHERE cc.is_active = 1
    GROUP BY cc.id, cc.name, cc.sla_days
    ORDER BY total DESC`;

    const [rows] = await pool.query(sql, vals);
    const result = rows.map(r => ({
      id: r.id, name: r.name, sla_days: r.sla_days,
      total: toNum(r.total), closed: toNum(r.closed),
      active: toNum(r.active), overdue: toNum(r.overdue),
      high_priority: toNum(r.cnt_high),
    }));
    return success(res, { report: result });
  } catch (err) { next(err); }
};

// ─── GET /api/reports/by-agency ───────────────────────────────────────────────
// Counts all assignments per agency (not just current is_active=1)
const byAgency = async (req, res, next) => {
  try {
    const { date_from, date_to, category_id } = req.query;
    const vals = [];

    const cOn = ['c.id = ca.complaint_id'];
    if (date_from)   { cOn.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)     { cOn.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (category_id) { cOn.push('c.category_id = ?'); vals.push(Number(category_id)); }

    const sql = `SELECT a.id, a.name, a.short_name,
      COUNT(DISTINCT c.id) AS total,
      COALESCE(SUM(c.status = 'CLOSED'), 0) AS closed,
      COALESCE(SUM(c.status NOT IN ('CLOSED','REJECTED')), 0) AS active,
      COALESCE(SUM(c.is_overdue = 1), 0) AS overdue
    FROM agencies a
    LEFT JOIN complaint_assignments ca ON ca.agency_id = a.id
    LEFT JOIN complaints c ON ${cOn.join(' AND ')}
    WHERE a.is_active = 1
    GROUP BY a.id, a.name, a.short_name
    ORDER BY total DESC`;

    const [rows] = await pool.query(sql, vals);
    const result = rows.map(r => ({
      id: r.id, name: r.name, short_name: r.short_name,
      total: toNum(r.total), closed: toNum(r.closed),
      active: toNum(r.active), overdue: toNum(r.overdue),
    }));
    return success(res, { report: result });
  } catch (err) { next(err); }
};

// ─── GET /api/reports/overdue ─────────────────────────────────────────────────
// Paginated list of overdue complaints
const overdue = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { date_from, date_to, category_id, agency_id } = req.query;
    const vals = [];

    let sql = `SELECT c.id, c.complaint_number, c.title, c.status, c.priority,
      c.due_date, DATEDIFF(CURDATE(), c.due_date) AS days_overdue,
      c.created_at,
      a.name AS agency_name, a.short_name AS agency_short_name,
      cc.name AS category_name,
      d.name AS district_name
    FROM complaints c
    LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.is_active = 1
    LEFT JOIN agencies a ON a.id = ca.agency_id
    LEFT JOIN complaint_categories cc ON cc.id = c.category_id
    LEFT JOIN districts d ON d.id = c.district_id`;

    if (agency_id) {
      // If agency_id filter specified, restrict to that agency's active assignment
      sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
      vals.push(Number(agency_id));
    }

    const where = [
      '(c.is_overdue = 1 OR (c.due_date IS NOT NULL AND c.due_date < CURDATE()))',
      "c.status NOT IN ('CLOSED','REJECTED')",
    ];
    if (date_from)   { where.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)     { where.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (category_id) { where.push('c.category_id = ?'); vals.push(Number(category_id)); }
    sql += ` WHERE ${where.join(' AND ')}`;

    // Count total
    let countSql = `SELECT COUNT(*) AS total FROM complaints c`;
    if (agency_id) {
      countSql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
    }
    countSql += ` WHERE ${where.join(' AND ')}`;
    const [[{ total }]] = await pool.query(countSql, vals);

    sql += ' ORDER BY days_overdue DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...vals, limit, offset]);

    return success(res, {
      report: rows.map(r => ({ ...r, days_overdue: toNum(r.days_overdue) })),
      pagination: paginationMeta(total, page, limit),
    });
  } catch (err) { next(err); }
};

// ─── GET /api/reports/export/excel ────────────────────────────────────────────
// type: monthly | by-category | by-agency | overdue
const exportExcel = async (req, res, next) => {
  try {
    const { type = 'monthly', year, date_from, date_to, category_id, agency_id } = req.query;

    if (!ALLOWED_EXPORT_TYPES.includes(type)) {
      return error(res, 'VALIDATION_ERROR', `type ต้องเป็น ${ALLOWED_EXPORT_TYPES.join(' | ')}`, 400);
    }

    // Fetch data from the appropriate query (reuse logic, not controller calls)
    let data = [];

    if (type === 'monthly') {
      const vals = [];
      const where = [];
      if (year) { where.push('YEAR(c.created_at) = ?'); vals.push(Number(year)); }
      addDateWhere(where, vals, date_from, date_to);
      if (category_id) { where.push('c.category_id = ?'); vals.push(Number(category_id)); }

      let sql = `SELECT YEAR(c.created_at) AS year, MONTH(c.created_at) AS month,
        COUNT(*) AS total, SUM(c.status = 'CLOSED') AS closed,
        SUM(c.status NOT IN ('CLOSED','REJECTED')) AS active,
        SUM(c.is_overdue = 1) AS overdue,
        SUM(c.priority = 'HIGH') AS cnt_high
      FROM complaints c`;
      if (agency_id) {
        sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
        vals.unshift(Number(agency_id));
      }
      if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
      sql += ' GROUP BY YEAR(c.created_at), MONTH(c.created_at) ORDER BY year, month';
      const [rows] = await pool.query(sql, vals);
      data = rows.map(r => ({
        year: toNum(r.year), month: toNum(r.month), total: toNum(r.total),
        closed: toNum(r.closed), active: toNum(r.active),
        overdue: toNum(r.overdue), high_priority: toNum(r.cnt_high),
      }));

    } else if (type === 'by-category') {
      const vals = [];
      const cOn = ['c.category_id = cc.id'];
      addDateWhere([], vals, date_from, date_to); // only for ON clause
      if (date_from) cOn.push('c.created_at >= ?');
      if (date_to)   cOn.push('c.created_at <= ?');
      if (agency_id) { cOn.push('c.id IN (SELECT complaint_id FROM complaint_assignments WHERE agency_id = ? AND is_active = 1)'); vals.push(Number(agency_id)); }

      const sql = `SELECT cc.id, cc.name, cc.sla_days,
        COUNT(c.id) AS total, COALESCE(SUM(c.status = 'CLOSED'),0) AS closed,
        COALESCE(SUM(c.status NOT IN ('CLOSED','REJECTED')),0) AS active,
        COALESCE(SUM(c.is_overdue = 1),0) AS overdue
      FROM complaint_categories cc
      LEFT JOIN complaints c ON ${cOn.join(' AND ')}
      WHERE cc.is_active = 1
      GROUP BY cc.id, cc.name, cc.sla_days ORDER BY total DESC`;
      const [rows] = await pool.query(sql, vals);
      data = rows.map(r => ({
        name: r.name, sla_days: toNum(r.sla_days), total: toNum(r.total),
        closed: toNum(r.closed), active: toNum(r.active), overdue: toNum(r.overdue),
      }));

    } else if (type === 'by-agency') {
      const vals = [];
      const cOn = ['c.id = ca.complaint_id'];
      if (date_from) { cOn.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
      if (date_to)   { cOn.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
      if (category_id) { cOn.push('c.category_id = ?'); vals.push(Number(category_id)); }
      const sql = `SELECT a.id, a.name, a.short_name,
        COUNT(DISTINCT c.id) AS total, COALESCE(SUM(c.status = 'CLOSED'),0) AS closed,
        COALESCE(SUM(c.status NOT IN ('CLOSED','REJECTED')),0) AS active,
        COALESCE(SUM(c.is_overdue = 1),0) AS overdue
      FROM agencies a
      LEFT JOIN complaint_assignments ca ON ca.agency_id = a.id
      LEFT JOIN complaints c ON ${cOn.join(' AND ')}
      WHERE a.is_active = 1
      GROUP BY a.id, a.name, a.short_name ORDER BY total DESC`;
      const [rows] = await pool.query(sql, vals);
      data = rows.map(r => ({
        name: r.name, short_name: r.short_name, total: toNum(r.total),
        closed: toNum(r.closed), active: toNum(r.active), overdue: toNum(r.overdue),
      }));

    } else if (type === 'overdue') {
      const vals = [];
      const where = [
        '(c.is_overdue = 1 OR (c.due_date IS NOT NULL AND c.due_date < CURDATE()))',
        "c.status NOT IN ('CLOSED','REJECTED')",
      ];
      addDateWhere(where, vals, date_from, date_to);
      if (category_id) { where.push('c.category_id = ?'); vals.push(Number(category_id)); }

      let sql = `SELECT c.complaint_number, c.title, c.status, c.priority,
        c.due_date, DATEDIFF(CURDATE(), c.due_date) AS days_overdue,
        a.name AS agency_name, cc.name AS category_name
      FROM complaints c
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.is_active = 1
      LEFT JOIN agencies a ON a.id = ca.agency_id
      LEFT JOIN complaint_categories cc ON cc.id = c.category_id`;
      if (agency_id) {
        sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
        vals.unshift(Number(agency_id));
      }
      sql += ` WHERE ${where.join(' AND ')} ORDER BY days_overdue DESC`;
      const [rows] = await pool.query(sql, vals);
      data = rows.map(r => ({ ...r, days_overdue: toNum(r.days_overdue) }));
    }

    const workbook = await createExcelReport(type, data);
    const filename = `report-${type}-${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

module.exports = { monthly, byCategory, byAgency, overdue, exportExcel };
