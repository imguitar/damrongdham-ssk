'use strict';

const pool = require('../config/database');

// Append a delivery record (sent / failed) for audit & observability.
// Supports all recipient types (citizen / user / line_group).
const create = async ({
  outboxId, citizenId, recipientType, recipientUserId, lineGroupId,
  complaintId, channel, eventType, status, providerMessageId, errorCode, errorMessage,
}) => {
  await pool.query(
    `INSERT INTO notification_logs
       (outbox_id, citizen_id, recipient_type, recipient_user_id, line_group_id,
        complaint_id, channel, event_type, status, provider_message_id, error_code, error_message, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      outboxId || null,
      citizenId || null,
      recipientType || 'citizen',
      recipientUserId || null,
      lineGroupId || null,
      complaintId || null,
      channel || 'line',
      eventType,
      status,
      providerMessageId || null,
      errorCode || null,
      errorMessage ? String(errorMessage).slice(0, 1000) : null,
      status === 'sent' ? new Date() : null,
    ]
  );
};

module.exports = { create };
