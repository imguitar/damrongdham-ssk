'use strict';

const pool = require('../config/database');

// Webhook idempotency: LINE redelivers events (and may send duplicates).
// The first INSERT wins; a duplicate key means we already handled this event.
// Returns true when the caller should process the event.
const claim = async ({ webhookEventId, eventType, sourceType }) => {
  if (!webhookEventId) return true; // no id (older payloads) → cannot dedupe, process once
  const [r] = await pool.query(
    `INSERT IGNORE INTO line_webhook_events (webhook_event_id, event_type, source_type)
     VALUES (?, ?, ?)`,
    [String(webhookEventId).slice(0, 100), String(eventType || '').slice(0, 30), sourceType || null]
  );
  return r.affectedRows === 1;
};

// Processing failed → drop the claim so a LINE redelivery can retry the event.
const release = async (webhookEventId) => {
  if (!webhookEventId) return;
  await pool.query('DELETE FROM line_webhook_events WHERE webhook_event_id = ?', [webhookEventId]);
};

// Retention: webhook ids only need to outlive LINE's redelivery window.
const purgeOlderThan = async (days = 30) => {
  const [r] = await pool.query(
    'DELETE FROM line_webhook_events WHERE received_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [days]
  );
  return r.affectedRows;
};

module.exports = { claim, release, purgeOlderThan };
