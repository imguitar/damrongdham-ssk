'use strict';

const cron = require('node-cron');
const pool = require('../config/database');
const notifSvc = require('../services/notificationService');

const runSlaCheck = async () => {
  try {
    // Find newly overdue complaints (is_overdue = 0 but past due_date)
    const [newlyOverdue] = await pool.query(`
      SELECT id, complaint_number FROM complaints
      WHERE due_date IS NOT NULL
        AND due_date < CURDATE()
        AND is_overdue = 0
        AND status NOT IN ('CLOSED','REJECTED')
    `);

    if (newlyOverdue.length) {
      // Mark them all overdue
      await pool.query(`
        UPDATE complaints SET is_overdue = 1, updated_at = NOW()
        WHERE due_date IS NOT NULL
          AND due_date < CURDATE()
          AND is_overdue = 0
          AND status NOT IN ('CLOSED','REJECTED')
      `);

      for (const c of newlyOverdue) {
        notifSvc.createForCenterUsers({
          complaintId: c.id,
          type: 'SLA_OVERDUE',
          title: notifSvc.NOTIFICATION_TEMPLATES.SLA_OVERDUE.title,
          message: notifSvc.NOTIFICATION_TEMPLATES.SLA_OVERDUE.message(c.complaint_number),
        }).catch((err) => console.error('[SlaJob] overdue notify error:', err.message));
      }

      console.log(`[SlaJob] Marked ${newlyOverdue.length} complaint(s) overdue`);
    }

    // Near-due: exactly 3 days remaining (fires only once per complaint)
    const [nearDue] = await pool.query(`
      SELECT id, complaint_number FROM complaints
      WHERE due_date IS NOT NULL
        AND DATEDIFF(due_date, CURDATE()) = 3
        AND is_overdue = 0
        AND status NOT IN ('CLOSED','REJECTED')
    `);

    for (const c of nearDue) {
      notifSvc.createForCenterUsers({
        complaintId: c.id,
        type: 'SLA_NEAR_DUE',
        title: notifSvc.NOTIFICATION_TEMPLATES.SLA_NEAR_DUE.title,
        message: notifSvc.NOTIFICATION_TEMPLATES.SLA_NEAR_DUE.message(c.complaint_number),
      }).catch((err) => console.error('[SlaJob] near-due notify error:', err.message));
    }

    if (nearDue.length) {
      console.log(`[SlaJob] Sent near-due notification for ${nearDue.length} complaint(s)`);
    }
  } catch (err) {
    console.error('[SlaJob] Run error:', err.message);
  }
};

const startSlaJob = () => {
  // Daily at 08:00 Bangkok time
  cron.schedule('0 8 * * *', runSlaCheck, { timezone: 'Asia/Bangkok' });
  console.log('[SlaJob] Scheduled daily at 08:00 Asia/Bangkok');
};

module.exports = { startSlaJob, runSlaCheck };
