'use strict';

const pool = require('../config/database');

// Enqueue a citizen notification into the transactional outbox.
// Pass a transaction connection (`conn`) so the row is committed atomically with
// the complaint change (§32). Falls back to the pool if no conn is given.
// No-op when there is no citizen owner (e.g. staff-submitted complaint).
// Idempotent on idempotency_key — duplicate enqueues are ignored.
const enqueue = async (conn, { eventType, citizenId, complaintId, complaintNumber, status, idempotencyKey }) => {
  if (!citizenId) return;
  const q = conn || pool;
  const payload = JSON.stringify({
    complaintNumber: complaintNumber || null,
    status: status || null,
  });
  await q.query(
    `INSERT INTO notification_outbox
       (event_type, citizen_id, complaint_id, channel, payload, idempotency_key)
     VALUES (?, ?, ?, 'line', ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [eventType, citizenId, complaintId || null, payload, idempotencyKey]
  );
};

module.exports = { enqueue };
