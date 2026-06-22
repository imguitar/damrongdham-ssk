'use strict';

const pool = require('../config/database');
const { generateComplaintNumber } = require('../utils/complaintNumber');

// Replaces PII fields with null when complaint is anonymous (PD-2.1)
const maskAnonymous = (complaint) => {
  if (!complaint || !complaint.is_anonymous) return complaint;
  return {
    ...complaint,
    complainant_name: null,
    complainant_id_card: null,
    complainant_phone: null,
    complainant_address: null,
    complainant_email: null,
    citizen_id: null,
  };
};

const SELECT_FIELDS = `
  c.id, c.complaint_number, c.title, c.description,
  c.complainant_name, c.complainant_id_card, c.complainant_phone,
  c.complainant_address, c.complainant_email, c.complainant_type_id,
  c.citizen_id, c.is_anonymous,
  c.service_type_id, c.complaint_nature_id, c.category_id, c.channel_id,
  c.province_id, c.district_id, c.subdistrict_id, c.postal_code,
  c.incident_address, c.latitude, c.longitude,
  c.priority, c.status, c.is_overdue, c.due_date,
  c.last_progress_at, c.escalation_level,
  c.received_by, c.source, c.rejection_reason,
  c.closed_at, c.closed_by, c.closed_summary,
  c.created_at, c.updated_at,
  cat.name AS category_name,
  ch.name  AS channel_name,
  st.name  AS service_type_name,
  cn.name  AS complaint_nature_name,
  ctype.name AS complainant_type_name,
  prov.name  AS province_name,
  dist.name  AS district_name,
  sub.name   AS subdistrict_name,
  u.full_name AS received_by_name
`;

const FROM_CLAUSE = `
  FROM complaints c
  LEFT JOIN complaint_categories cat   ON cat.id   = c.category_id
  LEFT JOIN complaint_channels ch      ON ch.id    = c.channel_id
  LEFT JOIN service_types st           ON st.id    = c.service_type_id
  LEFT JOIN complaint_natures cn       ON cn.id    = c.complaint_nature_id
  LEFT JOIN complainant_types ctype    ON ctype.id = c.complainant_type_id
  LEFT JOIN provinces prov             ON prov.id  = c.province_id
  LEFT JOIN districts dist             ON dist.id  = c.district_id
  LEFT JOIN subdistricts sub           ON sub.id   = c.subdistrict_id
  LEFT JOIN users u                    ON u.id     = c.received_by
`;

// Creates complaint inside a transaction (generates complaint_number, writes status_log).
const create = async ({
  title, description,
  serviceTypeId, complaintNatureId, complainantTypeId, channelId, categoryId,
  complainantName, complainantIdCard, complainantPhone, complainantAddress, complainantEmail,
  citizenId, isAnonymous,
  provinceId, districtId, subdistrictId, postalCode, incidentAddress,
  latitude, longitude,
  priority, source, receivedBy,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const complaintNumber = await generateComplaintNumber(conn);

    const [result] = await conn.query(
      `INSERT INTO complaints (
         complaint_number, title, description,
         complainant_type_id, complainant_name, complainant_id_card,
         complainant_phone, complainant_address, complainant_email,
         citizen_id, is_anonymous,
         service_type_id, complaint_nature_id, category_id, channel_id,
         province_id, district_id, subdistrict_id, postal_code, incident_address,
         latitude, longitude,
         priority, status, source, received_by,
         is_overdue, escalation_level,
         created_at, updated_at
       ) VALUES (
         ?, ?, ?,
         ?, ?, ?,
         ?, ?, ?,
         ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         ?, ?,
         ?, 'NEW', ?, ?,
         0, 0,
         NOW(), NOW()
       )`,
      [
        complaintNumber, title, description,
        complainantTypeId, complainantName || null, complainantIdCard || null,
        complainantPhone, complainantAddress || null, complainantEmail || null,
        citizenId || null, isAnonymous ? 1 : 0,
        serviceTypeId, complaintNatureId, categoryId || null, channelId,
        provinceId || null, districtId || null, subdistrictId || null, postalCode || null, incidentAddress || null,
        latitude || null, longitude || null,
        priority || 'MEDIUM',
        source || 'STAFF', receivedBy || null,
      ]
    );

    const complaintId = result.insertId;

    // Write initial status log
    await conn.query(
      `INSERT INTO complaint_status_logs (complaint_id, from_status, to_status, changed_by, note, created_at)
       VALUES (?, NULL, 'NEW', ?, NULL, NOW())`,
      [complaintId, receivedBy || null]
    );

    await conn.commit();
    return complaintId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const findAll = async ({
  status, category_id, agency_id: agencyIdFilter, district_id, province_id: provinceIdFilter,
  priority, is_overdue, search, date_from, date_to,
  sort = 'created_at', order = 'desc',
  limit = 20, offset = 0,
  currentUserAgencyId = null,
}) => {
  const filterParams = [];
  const whereConditions = [];

  // Restrict agency_officer/agency_head to their agency only
  if (currentUserAgencyId) {
    whereConditions.push(
      'EXISTS (SELECT 1 FROM complaint_assignments ca WHERE ca.complaint_id = c.id AND ca.agency_id = ? AND ca.is_active = 1)'
    );
    filterParams.push(currentUserAgencyId);
  }

  // Optional agency filter (for admins/officers filtering by agency)
  if (agencyIdFilter) {
    whereConditions.push(
      'EXISTS (SELECT 1 FROM complaint_assignments ca2 WHERE ca2.complaint_id = c.id AND ca2.agency_id = ?)'
    );
    filterParams.push(parseInt(agencyIdFilter));
  }

  if (status) { whereConditions.push('c.status = ?'); filterParams.push(status); }
  if (category_id) { whereConditions.push('c.category_id = ?'); filterParams.push(parseInt(category_id)); }
  if (district_id) { whereConditions.push('c.district_id = ?'); filterParams.push(parseInt(district_id)); }
  if (provinceIdFilter) { whereConditions.push('c.province_id = ?'); filterParams.push(parseInt(provinceIdFilter)); }
  if (priority) { whereConditions.push('c.priority = ?'); filterParams.push(priority); }
  if (is_overdue === 'true' || is_overdue === '1') { whereConditions.push('c.is_overdue = 1'); }
  if (search) {
    whereConditions.push('(c.title LIKE ? OR c.complaint_number LIKE ?)');
    filterParams.push(`%${search}%`, `%${search}%`);
  }
  if (date_from) { whereConditions.push('DATE(c.created_at) >= ?'); filterParams.push(date_from); }
  if (date_to) { whereConditions.push('DATE(c.created_at) <= ?'); filterParams.push(date_to); }

  const whereStr = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const validSortFields = ['created_at', 'updated_at', 'priority', 'status', 'complaint_number', 'due_date'];
  const safeSort = validSortFields.includes(sort) ? `c.${sort}` : 'c.created_at';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total ${FROM_CLAUSE} ${whereStr}`,
    filterParams
  );

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE} ${whereStr}
     ORDER BY ${safeSort} ${safeOrder}
     LIMIT ? OFFSET ?`,
    [...filterParams, limit, offset]
  );

  return { rows: rows.map(maskAnonymous), total };
};

const findById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE} WHERE c.id = ?`,
    [id]
  );
  return row ? maskAnonymous(row) : null;
};

const findByNumber = async (complaintNumber) => {
  const [[row]] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE} WHERE c.complaint_number = ?`,
    [complaintNumber]
  );
  return row ? maskAnonymous(row) : null;
};

// Returns raw (unmasked) complaint — only for identity reveal (super_admin only)
const findByIdUnmasked = async (id) => {
  const [[row]] = await pool.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE} WHERE c.id = ?`,
    [id]
  );
  return row || null;
};

// For public tracking — returns limited fields, no PII
const findByNumberForTracking = async (complaintNumber) => {
  const [[row]] = await pool.query(
    `SELECT c.id, c.complaint_number, c.title, c.status, c.priority,
            c.is_overdue, c.due_date, c.created_at, c.updated_at,
            cat.name AS category_name, ch.name AS channel_name
     FROM complaints c
     LEFT JOIN complaint_categories cat ON cat.id = c.category_id
     LEFT JOIN complaint_channels ch    ON ch.id  = c.channel_id
     WHERE c.complaint_number = ?`,
    [complaintNumber]
  );
  if (!row) return null;

  const [statusLogs] = await pool.query(
    `SELECT to_status, note, created_at
     FROM complaint_status_logs WHERE complaint_id = ? ORDER BY created_at ASC`,
    [row.id]
  );

  return { ...row, status_logs: statusLogs };
};

const update = async (id, fields) => {
  const allowed = [
    'title', 'description', 'service_type_id', 'complaint_nature_id',
    'complainant_type_id', 'channel_id', 'category_id', 'priority',
    'complainant_name', 'complainant_id_card', 'complainant_phone',
    'complainant_address', 'complainant_email', 'is_anonymous',
    'province_id', 'district_id', 'subdistrict_id',
    'postal_code', 'incident_address', 'latitude', 'longitude',
  ];

  const sets = [];
  const params = [];

  const DECIMAL_COLS = ['latitude', 'longitude'];
  for (const [key, val] of Object.entries(fields)) {
    if (!allowed.includes(key) || val === undefined) continue;
    const sanitized = DECIMAL_COLS.includes(key) && val === '' ? null : val;
    sets.push(`${key} = ?`);
    params.push(sanitized);
  }

  if (sets.length === 0) return false;

  sets.push('updated_at = NOW()');
  params.push(id);

  await pool.query(
    `UPDATE complaints SET ${sets.join(', ')} WHERE id = ? AND status != 'CLOSED'`,
    params
  );
  return true;
};

// Returns combined status_logs + updates sorted by created_at
const getTimeline = async (complaintId) => {
  const [statusLogs] = await pool.query(
    `SELECT sl.id, sl.complaint_id, sl.from_status, sl.to_status,
            sl.note, sl.created_at, u.full_name AS actor_name, a.name AS actor_agency
     FROM complaint_status_logs sl
     LEFT JOIN users u ON u.id = sl.changed_by
     LEFT JOIN agencies a ON a.id = u.agency_id
     WHERE sl.complaint_id = ?
     ORDER BY sl.created_at ASC`,
    [complaintId]
  );

  const [updates] = await pool.query(
    `SELECT cu.id, cu.complaint_id, cu.update_type, cu.content,
            cu.created_at, u.full_name AS actor_name, a.name AS actor_agency
     FROM complaint_updates cu
     LEFT JOIN users u ON u.id = cu.updated_by
     LEFT JOIN agencies a ON a.id = u.agency_id
     WHERE cu.complaint_id = ?
     ORDER BY cu.created_at ASC`,
    [complaintId]
  );

  const timeline = [
    ...statusLogs.map((e) => ({ ...e, event_type: 'status_change' })),
    ...updates.map((e) => ({ ...e, event_type: 'update' })),
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return timeline;
};

const findUpdatesByComplaintId = async (complaintId) => {
  const [rows] = await pool.query(
    `SELECT cu.*, u.full_name AS actor_name
     FROM complaint_updates cu
     LEFT JOIN users u ON u.id = cu.updated_by
     WHERE cu.complaint_id = ?
     ORDER BY cu.created_at DESC`,
    [complaintId]
  );
  return rows;
};

// For citizen self-service: list complaints belonging to a citizen
const findByCitizenId = async (citizenId, { limit = 20, offset = 0 }) => {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM complaints WHERE citizen_id = ?',
    [citizenId]
  );

  const [rows] = await pool.query(
    `SELECT c.id, c.complaint_number, c.title, c.status, c.priority,
            c.is_anonymous, c.is_overdue, c.due_date, c.created_at, c.updated_at,
            cat.name AS category_name
     FROM complaints c
     LEFT JOIN complaint_categories cat ON cat.id = c.category_id
     WHERE c.citizen_id = ?
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [citizenId, limit, offset]
  );

  return { rows, total };
};

const deleteById = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM anonymous_reveal_logs   WHERE complaint_id = ?', [id]);
    await conn.query('DELETE FROM complaint_updates       WHERE complaint_id = ?', [id]);
    await conn.query('DELETE FROM complaint_attachments   WHERE complaint_id = ?', [id]);
    await conn.query('DELETE FROM complaint_status_logs   WHERE complaint_id = ?', [id]);
    await conn.query('DELETE FROM complaint_assignments   WHERE complaint_id = ?', [id]);
    await conn.query('DELETE FROM complaints              WHERE id = ?',           [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  create,
  findAll,
  findById,
  findByNumber,
  findByIdUnmasked,
  findByNumberForTracking,
  update,
  getTimeline,
  findUpdatesByComplaintId,
  deleteById,
  findByCitizenId,
};
