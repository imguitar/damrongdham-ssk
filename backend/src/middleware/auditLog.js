'use strict';

const pool = require('../config/database');

const writeAuditLog = async ({ userId, action, resource, resourceId, details, ipAddress, userAgent }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        resource || null,
        resourceId || null,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (err) {
    console.error('[AuditLog] Failed to write:', err.message);
  }
};

module.exports = { writeAuditLog };
