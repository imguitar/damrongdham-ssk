'use strict';

const cron = require('node-cron');
const pool = require('../config/database');
const notifSvc = require('../services/notificationService');
const staffNotifier = require('../services/staffLineNotifier');
const settingModel = require('../models/settingModel');

const ACTIVE_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];
const STATUS_IN = ACTIVE_STATUSES.map(() => '?').join(',');

const runEscalationCheck = async () => {
  try {
    const settings = await settingModel.getEscalationSettings();
    if (!settings.escalation_enabled) {
      console.log('[EscalationJob] Disabled by system settings');
      return;
    }

    const l1Days = settings.escalation_l1_days;
    const l2Days = settings.escalation_l2_days;
    const l3Days = settings.escalation_l3_days;

    // Level 0 → 1: no update for the configured L1 threshold
    const [l0] = await pool.query(
      `SELECT id, complaint_number FROM complaints
       WHERE status IN (${STATUS_IN})
         AND escalation_level = 0
         AND DATEDIFF(NOW(), COALESCE(last_progress_at, created_at)) >= ?`,
      [...ACTIVE_STATUSES, l1Days]
    );

    for (const c of l0) {
      await pool.query(
        'UPDATE complaints SET escalation_level = 1, last_escalation_at = NOW() WHERE id = ?',
        [c.id]
      );
      const agencyId = await notifSvc.getActiveAgencyId(c.id);
      const notifData = {
        complaintId: c.id,
        type: 'ESCALATION_L1',
        title: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L1.title(l1Days),
        message: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L1.message(c.complaint_number, l1Days),
      };
      notifSvc.createForCenterUsers(notifData).catch((err) => console.error('[EscalationJob] L1 center error:', err.message));
      if (agencyId) {
        notifSvc.createForAgencyUsers(agencyId, notifData).catch((err) => console.error('[EscalationJob] L1 agency error:', err.message));
      }
      staffNotifier.notifyEscalation(c.id, agencyId, 1); // staff LINE group
    }

    if (l0.length) console.log(`[EscalationJob] L1 escalated: ${l0.length}`);

    // Level 1 → 2: no update for the cumulative L2 threshold
    const [l1] = await pool.query(
      `SELECT id, complaint_number FROM complaints
       WHERE status IN (${STATUS_IN})
         AND escalation_level = 1
         AND DATEDIFF(NOW(), COALESCE(last_progress_at, created_at)) >= ?`,
      [...ACTIVE_STATUSES, l2Days]
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
        title: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L2.title(l2Days),
        message: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L2.message(c.complaint_number, l2Days),
      };
      notifSvc.createForCenterUsers(notifData).catch((err) => console.error('[EscalationJob] L2 center error:', err.message));
      if (agencyId) {
        notifSvc.createForAgencyUsers(agencyId, notifData).catch((err) => console.error('[EscalationJob] L2 agency error:', err.message));
      }
      staffNotifier.notifyEscalation(c.id, agencyId, 2); // staff LINE group
    }

    if (l1.length) console.log(`[EscalationJob] L2 escalated: ${l1.length}`);

    // Level 2 → 3: no update for the cumulative L3 threshold
    const [l2] = await pool.query(
      `SELECT id, complaint_number FROM complaints
       WHERE status IN (${STATUS_IN})
         AND escalation_level = 2
         AND DATEDIFF(NOW(), COALESCE(last_progress_at, created_at)) >= ?`,
      [...ACTIVE_STATUSES, l3Days]
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
        title: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L3.title(l3Days),
        message: notifSvc.NOTIFICATION_TEMPLATES.ESCALATION_L3.message(c.complaint_number, l3Days),
      };
      notifSvc.createForCenterUsers(notifData).catch((err) => console.error('[EscalationJob] L3 center error:', err.message));
      if (agencyId) {
        notifSvc.createForAgencyUsers(agencyId, notifData).catch((err) => console.error('[EscalationJob] L3 agency error:', err.message));
      }
      staffNotifier.notifyEscalation(c.id, agencyId, 3); // staff LINE group
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
