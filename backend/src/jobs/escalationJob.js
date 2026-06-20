'use strict';

const cron = require('node-cron');
const pool = require('../config/database');
const notifSvc = require('../services/notificationService');

const ACTIVE_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];
const STATUS_IN = ACTIVE_STATUSES.map(() => '?').join(',');

const runEscalationCheck = async () => {
  try {
    // Level 0 → 1: no update for ≥ 30 days
    const [l0] = await pool.query(
      `SELECT id, complaint_number FROM complaints
       WHERE status IN (${STATUS_IN})
         AND escalation_level = 0
         AND DATEDIFF(NOW(), COALESCE(last_progress_at, created_at)) >= 30`,
      ACTIVE_STATUSES
    );

    for (const c of l0) {
      await pool.query(
        'UPDATE complaints SET escalation_level = 1, last_escalation_at = NOW() WHERE id = ?',
        [c.id]
      );
      notifSvc.createForCenterUsers({
        complaintId: c.id,
        type: 'ESCALATION_L1',
        title: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L1.title,
        message: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L1.message(c.complaint_number),
      }).catch((err) => console.error('[EscalationJob] L1 notify error:', err.message));
    }

    if (l0.length) console.log(`[EscalationJob] L1 escalated: ${l0.length}`);

    // Level 1 → 2: no update for ≥ 45 days
    const [l1] = await pool.query(
      `SELECT id, complaint_number FROM complaints
       WHERE status IN (${STATUS_IN})
         AND escalation_level = 1
         AND DATEDIFF(NOW(), COALESCE(last_progress_at, created_at)) >= 45`,
      ACTIVE_STATUSES
    );

    for (const c of l1) {
      await pool.query(
        'UPDATE complaints SET escalation_level = 2, last_escalation_at = NOW() WHERE id = ?',
        [c.id]
      );
      const agencyId = await notifSvc.getActiveAgencyId(c.id);
      const notifData = {
        complaintId: c.id,
        type: 'ESCALATION_L2',
        title: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L2.title,
        message: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L2.message(c.complaint_number),
      };
      notifSvc.createForCenterUsers(notifData).catch((err) => console.error('[EscalationJob] L2 center error:', err.message));
      if (agencyId) {
        notifSvc.createForAgencyHeads(agencyId, notifData).catch((err) => console.error('[EscalationJob] L2 agency error:', err.message));
      }
    }

    if (l1.length) console.log(`[EscalationJob] L2 escalated: ${l1.length}`);

    // Level 2 → 3: no update for ≥ 52 days
    const [l2] = await pool.query(
      `SELECT id, complaint_number FROM complaints
       WHERE status IN (${STATUS_IN})
         AND escalation_level = 2
         AND DATEDIFF(NOW(), COALESCE(last_progress_at, created_at)) >= 52`,
      ACTIVE_STATUSES
    );

    for (const c of l2) {
      await pool.query(
        'UPDATE complaints SET escalation_level = 3, last_escalation_at = NOW() WHERE id = ?',
        [c.id]
      );
      const agencyId = await notifSvc.getActiveAgencyId(c.id);
      const notifData = {
        complaintId: c.id,
        type: 'ESCALATION_L3',
        title: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L3.title,
        message: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L3.message(c.complaint_number),
      };
      notifSvc.createForCenterUsers(notifData).catch((err) => console.error('[EscalationJob] L3 center error:', err.message));
      if (agencyId) {
        notifSvc.createForAgencyHeads(agencyId, notifData).catch((err) => console.error('[EscalationJob] L3 agency error:', err.message));
      }
    }

    if (l2.length) console.log(`[EscalationJob] L3 escalated: ${l2.length}`);
  } catch (err) {
    console.error('[EscalationJob] Run error:', err.message);
  }
};

const startEscalationJob = () => {
  cron.schedule('0 8 * * *', runEscalationCheck, { timezone: 'Asia/Bangkok' });
  console.log('[EscalationJob] Scheduled daily at 08:00 Asia/Bangkok');
};

module.exports = { startEscalationJob, runEscalationCheck };
