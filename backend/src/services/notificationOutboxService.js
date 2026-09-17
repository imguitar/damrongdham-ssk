'use strict';

const pool = require('../config/database');

// Enqueue a citizen notification into the transactional outbox.
// Pass a transaction connection (`conn`) so the row is committed atomically with
// the complaint change (§32). Falls back to the pool if no conn is given.
// No-op when there is no citizen owner (e.g. staff-submitted complaint).
// Idempotent on idempotency_key — duplicate enqueues are ignored.
// ข้อความถึงประชาชนใช้รหัสติดตาม (tracking_code) เท่านั้น — complaint_number เป็นเลขภายในของเจ้าหน้าที่
const enqueue = async (conn, { eventType, citizenId, complaintId, status, idempotencyKey, extra }) => {
  if (!citizenId) return;
  const q = conn || pool;
  const [[complaint]] = complaintId
    ? await q.query('SELECT tracking_code FROM complaints WHERE id = ?', [complaintId])
    : [[]];
  const payload = JSON.stringify({
    trackingCode: complaint?.tracking_code || null,
    status: status || null,
    // extra: ข้อมูล public-safe ที่จำเป็นต่อ template; customMessage มาจากเจ้าหน้าที่ที่ยืนยันก่อนส่ง
    ...(extra || {}),
  });
  await q.query(
    `INSERT INTO notification_outbox
       (event_type, citizen_id, complaint_id, channel, payload, idempotency_key)
     VALUES (?, ?, ?, 'line', ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [eventType, citizenId, complaintId || null, payload, idempotencyKey]
  );
};

// Enqueue a notification to a LINE group (staff situational alerts).
// Idempotent on idempotency_key; no-op without a groupId.
const enqueueGroup = async (conn, { eventType, groupId, complaintId, payload, idempotencyKey }) => {
  if (!groupId) return;
  const q = conn || pool;
  await q.query(
    `INSERT INTO notification_outbox
       (event_type, recipient_type, citizen_id, line_group_id, complaint_id, channel, payload, idempotency_key)
     VALUES (?, 'line_group', NULL, ?, ?, 'line', ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [eventType, groupId, complaintId || null, JSON.stringify(payload || {}), idempotencyKey]
  );
};

// Enqueue a personal DM to a staff user. Idempotent; no-op without a userId.
const enqueueUser = async (conn, { eventType, userId, complaintId, payload, idempotencyKey }) => {
  if (!userId) return;
  const q = conn || pool;
  await q.query(
    `INSERT INTO notification_outbox
       (event_type, recipient_type, citizen_id, recipient_user_id, complaint_id, channel, payload, idempotency_key)
     VALUES (?, 'user', NULL, ?, ?, 'line', ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [eventType, userId, complaintId || null, JSON.stringify(payload || {}), idempotencyKey]
  );
};

module.exports = { enqueue, enqueueGroup, enqueueUser };
