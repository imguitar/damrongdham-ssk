'use strict';

const pool = require('../config/database');
const { success } = require('../utils/response');

const AGENCY_ROLES = ['agency_officer', 'agency_head'];

// Inject INNER JOIN for agency scoping when needed
const injectAgencyJoin = (sql, vals, role, userAgencyId, queryAgencyId) => {
  const agencyId = AGENCY_ROLES.includes(role) ? userAgencyId : (queryAgencyId || null);
  if (agencyId) {
    sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
    vals.push(Number(agencyId));
  }
  return sql;
};

// Build optional WHERE conditions for date / district / category filters on alias 'c'
const buildWhere = ({ date_from, date_to, district_id, category_id }, vals) => {
  const clauses = [];
  if (date_from)   { clauses.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
  if (date_to)     { clauses.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
  if (district_id) { clauses.push('c.district_id = ?');  vals.push(Number(district_id)); }
  if (category_id) { clauses.push('c.category_id = ?');  vals.push(Number(category_id)); }
  return clauses;
};

const toNum = (v) => Number(v || 0);

// ─── GET /api/dashboard/summary ───────────────────────────────────────────────
// Roles: all staff — agency roles scoped to their own complaints
const summary = async (req, res, next) => {
  try {
    const { date_from, date_to, district_id, category_id, agency_id } = req.query;
    const vals = [];

    let sql = `SELECT
      COUNT(*) AS total,
      SUM(c.status = 'NEW') AS \`new\`,
      SUM(c.status = 'SCREENING') AS screening,
      SUM(c.status = 'ASSIGNED') AS assigned,
      SUM(c.status = 'ACCEPTED') AS accepted,
      SUM(c.status = 'IN_PROGRESS') AS in_progress,
      SUM(c.status = 'RESOLVED') AS resolved,
      SUM(c.status = 'REVIEWING') AS reviewing,
      SUM(c.status = 'CLOSED') AS closed,
      SUM(c.status = 'REJECTED') AS rejected,
      SUM(c.status = 'RETURNED') AS returned,
      SUM(c.is_overdue = 1) AS overdue
    FROM complaints c`;

    sql = injectAgencyJoin(sql, vals, req.user.role, req.user.agency_id, agency_id);

    const where = buildWhere({ date_from, date_to, district_id, category_id }, vals);
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;

    const [[row]] = await pool.query(sql, vals);
    const parsed = {};
    for (const [k, v] of Object.entries(row)) parsed[k] = toNum(v);

    return success(res, { summary: parsed });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/by-status ─────────────────────────────────────────────
// Roles: all staff — returns status array for pie/donut charts
const byStatus = async (req, res, next) => {
  try {
    const { date_from, date_to, agency_id } = req.query;
    const vals = [];

    let sql = 'SELECT c.status, COUNT(*) AS count FROM complaints c';
    sql = injectAgencyJoin(sql, vals, req.user.role, req.user.agency_id, agency_id);

    const where = buildWhere({ date_from, date_to }, vals);
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' GROUP BY c.status ORDER BY count DESC';

    const [rows] = await pool.query(sql, vals);
    return success(res, { by_status: rows.map(r => ({ status: r.status, count: toNum(r.count) })) });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/by-category ───────────────────────────────────────────
// Roles: officer, chief, admin, executive — no agency scoping
const byCategory = async (req, res, next) => {
  try {
    const { date_from, date_to, agency_id } = req.query;
    const vals = [];

    // Build LEFT JOIN conditions (keeps categories with 0 complaints)
    const cOn = ['c.category_id = cc.id'];
    if (date_from) { cOn.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)   { cOn.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (agency_id) { cOn.push('c.id IN (SELECT complaint_id FROM complaint_assignments WHERE agency_id = ? AND is_active = 1)'); vals.push(Number(agency_id)); }

    const sql = `SELECT cc.id, cc.name, cc.sla_days,
      COUNT(c.id) AS total,
      COALESCE(SUM(c.status = 'CLOSED'), 0) AS closed,
      COALESCE(SUM(c.status NOT IN ('CLOSED','REJECTED')), 0) AS active,
      COALESCE(SUM(c.is_overdue = 1), 0) AS overdue
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
    }));
    return success(res, { by_category: result });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/by-agency ─────────────────────────────────────────────
// Roles: officer, chief, admin, executive — shows ALL active agencies
const byAgency = async (req, res, next) => {
  try {
    const { date_from, date_to, category_id } = req.query;
    const vals = [];

    // Conditions on complaints (in LEFT JOIN ON clause to preserve all agencies)
    const cOn = ['c.id = ca.complaint_id'];
    if (date_from)   { cOn.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)     { cOn.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (category_id) { cOn.push('c.category_id = ?'); vals.push(Number(category_id)); }

    const sql = `SELECT a.id, a.name, a.short_name,
      COUNT(c.id) AS total,
      COALESCE(SUM(c.status = 'CLOSED'), 0) AS closed,
      COALESCE(SUM(c.status NOT IN ('CLOSED','REJECTED')), 0) AS active,
      COALESCE(SUM(c.is_overdue = 1), 0) AS overdue
    FROM agencies a
    LEFT JOIN complaint_assignments ca ON ca.agency_id = a.id AND ca.is_active = 1
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
    return success(res, { by_agency: result });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/by-district ───────────────────────────────────────────
// Roles: officer, chief, admin, executive — groups by district_id on complaints
const byDistrict = async (req, res, next) => {
  try {
    const { date_from, date_to, agency_id, category_id } = req.query;
    const vals = [];

    let sql = `SELECT d.id, d.name,
      COUNT(c.id) AS total,
      COALESCE(SUM(c.status = 'CLOSED'), 0) AS closed,
      COALESCE(SUM(c.is_overdue = 1), 0) AS overdue
    FROM complaints c
    INNER JOIN districts d ON d.id = c.district_id`;

    if (agency_id) {
      sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
      vals.push(Number(agency_id));
    }

    const where = buildWhere({ date_from, date_to, category_id }, vals);
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' GROUP BY d.id, d.name ORDER BY total DESC';

    const [rows] = await pool.query(sql, vals);
    const result = rows.map(r => ({
      id: r.id, name: r.name,
      total: toNum(r.total), closed: toNum(r.closed), overdue: toNum(r.overdue),
    }));
    return success(res, { by_district: result });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/trend ─────────────────────────────────────────────────
// Roles: officer, chief, admin, executive — monthly trend for a given year
const trend = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), agency_id } = req.query;
    const vals = [];

    let sql = `SELECT MONTH(c.created_at) AS month,
      COUNT(*) AS total,
      SUM(c.status = 'CLOSED') AS closed
    FROM complaints c`;

    const effectiveAgencyId = AGENCY_ROLES.includes(req.user.role) ? req.user.agency_id : (agency_id || null);
    if (effectiveAgencyId) {
      sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
      vals.push(Number(effectiveAgencyId));
    }

    sql += ' WHERE YEAR(c.created_at) = ? GROUP BY MONTH(c.created_at) ORDER BY month ASC';
    vals.push(Number(year));

    const [rows] = await pool.query(sql, vals);

    // Fill all 12 months (missing months get 0)
    const byMonth = Object.fromEntries(rows.map(r => [r.month, r]));
    const result = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { month: m, total: toNum(byMonth[m]?.total), closed: toNum(byMonth[m]?.closed) };
    });

    return success(res, { year: Number(year), trend: result });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/overdue ───────────────────────────────────────────────
// Roles: officer, chief, admin — list of overdue complaints (not closed/rejected)
const overdue = async (req, res, next) => {
  try {
    const { date_from, date_to, category_id } = req.query;
    const vals = [];

    let sql = `SELECT c.id, c.complaint_number, c.title, c.status, c.priority,
      c.due_date, DATEDIFF(CURDATE(), c.due_date) AS days_overdue,
      a.name AS agency_name, a.short_name AS agency_short_name,
      cc.name AS category_name
    FROM complaints c
    LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.is_active = 1
    LEFT JOIN agencies a ON a.id = ca.agency_id
    LEFT JOIN complaint_categories cc ON cc.id = c.category_id`;

    const where = [
      '(c.is_overdue = 1 OR (c.due_date IS NOT NULL AND c.due_date < CURDATE()))',
      "c.status NOT IN ('CLOSED','REJECTED')",
    ];
    if (date_from)   { where.push('c.created_at >= ?'); vals.push(`${date_from} 00:00:00`); }
    if (date_to)     { where.push('c.created_at <= ?'); vals.push(`${date_to} 23:59:59`); }
    if (category_id) { where.push('c.category_id = ?'); vals.push(Number(category_id)); }

    sql += ` WHERE ${where.join(' AND ')} ORDER BY days_overdue DESC LIMIT 100`;

    const [rows] = await pool.query(sql, vals);
    return success(res, { overdue: rows.map(r => ({ ...r, days_overdue: toNum(r.days_overdue) })) });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/near-due ──────────────────────────────────────────────
// Roles: officer, chief, admin — complaints with due_date within 3 days
const nearDue = async (req, res, next) => {
  try {
    const { category_id } = req.query;
    const vals = [];

    let sql = `SELECT c.id, c.complaint_number, c.title, c.status, c.priority,
      c.due_date, DATEDIFF(c.due_date, CURDATE()) AS days_remaining,
      a.name AS agency_name, a.short_name AS agency_short_name,
      cc.name AS category_name
    FROM complaints c
    LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.is_active = 1
    LEFT JOIN agencies a ON a.id = ca.agency_id
    LEFT JOIN complaint_categories cc ON cc.id = c.category_id
    WHERE c.due_date IS NOT NULL
      AND DATEDIFF(c.due_date, CURDATE()) BETWEEN 0 AND 3
      AND c.is_overdue = 0
      AND c.status NOT IN ('CLOSED','REJECTED')`;

    if (category_id) { sql += ' AND c.category_id = ?'; vals.push(Number(category_id)); }
    sql += ' ORDER BY days_remaining ASC LIMIT 100';

    const [rows] = await pool.query(sql, vals);
    return success(res, { near_due: rows.map(r => ({ ...r, days_remaining: toNum(r.days_remaining) })) });
  } catch (err) { next(err); }
};

// ─── GET /api/dashboard/escalated ────────────────────────────────────────────
// Returns complaints with escalation_level 1, 2, or 3 (not yet closed/rejected)
const escalated = async (req, res, next) => {
  try {
    const effectiveAgencyId = AGENCY_ROLES.includes(req.user.role) ? req.user.agency_id : null;

    let sql = `SELECT c.id, c.complaint_number, c.title,
        c.escalation_level, c.priority, c.status,
        c.due_date, c.last_progress_at, c.last_escalation_at,
        a.name AS agency_name, a.short_name AS agency_short_name
      FROM complaints c
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.is_active = 1
      LEFT JOIN agencies a ON a.id = ca.agency_id`;

    const vals = [];
    if (effectiveAgencyId) {
      sql += ' INNER JOIN complaint_assignments _ag ON _ag.complaint_id = c.id AND _ag.agency_id = ? AND _ag.is_active = 1';
      vals.push(Number(effectiveAgencyId));
    }

    sql += ` WHERE c.escalation_level > 0
        AND c.status NOT IN ('CLOSED','REJECTED')
      ORDER BY c.escalation_level DESC, c.last_progress_at ASC`;

    const [rows] = await pool.query(sql, vals);
    return success(res, { escalated: rows });
  } catch (err) { next(err); }
};

module.exports = { summary, byStatus, byCategory, byAgency, byDistrict, trend, overdue, nearDue, escalated };
