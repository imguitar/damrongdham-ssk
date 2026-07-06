'use strict';

const pool = require('../config/database');

// Claim a batch of due rows for processing. Concurrency-safe: each row is
// flipped to 'processing' with a guarded UPDATE, so two workers never grab the
// same row. next_attempt_at is bumped to NOW() so stale-processing rows can be
// detected and requeued later.
const claimDueBatch = async (limit) => {
  const [cands] = await pool.query(
    `SELECT id FROM notification_outbox
     WHERE status IN ('pending','retry') AND next_attempt_at <= NOW()
     ORDER BY next_attempt_at ASC
     LIMIT ?`,
    [limit]
  );

  const claimed = [];
  for (const { id } of cands) {
    const [r] = await pool.query(
      `UPDATE notification_outbox
       SET status='processing', next_attempt_at=NOW()
       WHERE id = ? AND status IN ('pending','retry')`,
      [id]
    );
    if (r.affectedRows === 1) claimed.push(id);
  }
  if (!claimed.length) return [];

  const placeholders = claimed.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT * FROM notification_outbox WHERE id IN (${placeholders})`,
    claimed
  );
  return rows;
};

// Recover rows left in 'processing' by a crashed worker
const requeueStale = async (minutes) => {
  const [r] = await pool.query(
    `UPDATE notification_outbox
     SET status='retry'
     WHERE status='processing' AND next_attempt_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [minutes]
  );
  return r.affectedRows;
};

const markSent = async (id) => {
  await pool.query(
    `UPDATE notification_outbox
     SET status='sent', attempt_count=attempt_count+1, processed_at=NOW(), last_error=NULL
     WHERE id=?`,
    [id]
  );
};

const markRetry = async (id, backoffSeconds, errMsg) => {
  await pool.query(
    `UPDATE notification_outbox
     SET status='retry', attempt_count=attempt_count+1,
         next_attempt_at=DATE_ADD(NOW(), INTERVAL ? SECOND), last_error=?
     WHERE id=?`,
    [backoffSeconds, (errMsg || '').slice(0, 1000), id]
  );
};

// Dead-letter: exhausted retries or non-retryable error — needs manual review
const markFailed = async (id, errMsg) => {
  await pool.query(
    `UPDATE notification_outbox
     SET status='failed', attempt_count=attempt_count+1, processed_at=NOW(), last_error=?
     WHERE id=?`,
    [(errMsg || '').slice(0, 1000), id]
  );
};

// Intentionally not delivered (no identity / preference off / no template)
const markCancelled = async (id, reason) => {
  await pool.query(
    `UPDATE notification_outbox
     SET status='cancelled', processed_at=NOW(), last_error=?
     WHERE id=?`,
    [(reason || '').slice(0, 1000), id]
  );
};

module.exports = { claimDueBatch, requeueStale, markSent, markRetry, markFailed, markCancelled };
