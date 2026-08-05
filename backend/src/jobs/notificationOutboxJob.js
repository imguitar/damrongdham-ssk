'use strict';

const cron = require('node-cron');
const outboxModel = require('../models/outboxModel');
const logModel = require('../models/notificationLogModel');
const identityModel = require('../models/citizenIdentityModel');
const prefModel = require('../models/notificationPrefModel');
const lineGroupModel = require('../models/lineGroupModel');
const userIdentityModel = require('../models/userIdentityModel');
const userPrefModel = require('../models/userNotificationPrefModel');
const messaging = require('../services/lineMessagingService');
const tpl = require('../utils/lineMessageTemplate');

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
// exponential-ish backoff per next attempt number (seconds): 1m, 5m, 15m, 1h, 3h
const BACKOFF_SECONDS = [60, 300, 900, 3600, 10800];
const STALE_PROCESSING_MINUTES = 5;

// event_type → preference column that must be enabled
const EVENT_PREF_MAP = {
  COMPLAINT_STATUS_CHANGED:     'notify_status_change',
  COMPLAINT_CLOSED:             'notify_closed',
  COMPLAINT_RESOLVED:           'notify_resolved',
  COMPLAINT_MORE_INFO_REQUIRED: 'notify_more_info_required',
  COMPLAINT_PROGRESS_UPDATED:   'notify_progress_update',
};

// No preference row → default ON (all channels/events enabled)
const isEnabled = (pref, eventType) => {
  if (!pref) return true;
  if (!pref.line_enabled) return false;
  const col = EVENT_PREF_MAP[eventType];
  if (col && pref[col] === 0) return false;
  return true;
};

// staff DM event_type → user preference column
const USER_EVENT_PREF_MAP = {
  STAFF_NEW_COMPLAINT: 'notify_new',
  STAFF_FORWARDED:     'notify_forwarded',
  STAFF_SLA_DUE:       'notify_sla',
  STAFF_SLA_OVERDUE:   'notify_sla',
  STAFF_ESCALATION:    'notify_escalation',
};
const isUserEnabled = (pref, eventType) => {
  if (!pref) return true;
  if (!pref.line_enabled) return false;
  const col = USER_EVENT_PREF_MAP[eventType];
  if (col && pref[col] === 0) return false;
  return true;
};

const parsePayload = (payload) => {
  if (!payload) return {};
  try { return typeof payload === 'string' ? JSON.parse(payload) : payload; }
  catch { return {}; }
};

// Shared delivery: push + mark outbox + write log + retry classification.
const deliver = async (row, to, text, logBase) => {
  const res = await messaging.pushText({ to, text, idempotencyKey: row.idempotency_key });

  if (res.ok) {
    await outboxModel.markSent(row.id);
    await logModel.create({ ...logBase, status: 'sent', providerMessageId: res.providerMessageId });
    return 'sent';
  }

  const nextAttempt = row.attempt_count + 1;
  const detail = `${res.errorCode || 'ERR'}: ${res.errorMessage || ''}`.trim();

  if (res.retryable && nextAttempt < MAX_ATTEMPTS) {
    const backoff = BACKOFF_SECONDS[Math.min(nextAttempt - 1, BACKOFF_SECONDS.length - 1)];
    await outboxModel.markRetry(row.id, backoff, detail);
    return 'retried';
  }

  await outboxModel.markFailed(row.id, detail);
  await logModel.create({ ...logBase, status: 'failed', errorCode: res.errorCode, errorMessage: res.errorMessage });
  return 'failed';
};

// Staff LINE-group notification (situational alerts for a unit)
const processGroupRow = async (row) => {
  const target = await lineGroupModel.findTargetByGroup(row.line_group_id);
  if (!target || !target.is_active) {
    await outboxModel.markCancelled(row.id, 'group_inactive');
    return 'cancelled';
  }
  const text = tpl.buildStaffByEvent(row.event_type, parsePayload(row.payload));
  if (!text) {
    await outboxModel.markFailed(row.id, 'no_template');
    return 'failed';
  }
  const logBase = {
    outboxId: row.id, recipientType: 'line_group', lineGroupId: row.line_group_id,
    complaintId: row.complaint_id, channel: 'line', eventType: row.event_type,
  };
  return deliver(row, row.line_group_id, text, logBase);
};

// Citizen notification (personal push)
const processCitizenRow = async (row) => {
  const identity = await identityModel.findByCitizen(row.citizen_id, 'line');
  if (!identity?.provider_user_id) {
    await outboxModel.markCancelled(row.id, 'no_line_identity');
    return 'cancelled';
  }
  const pref = await prefModel.getByCitizen(row.citizen_id);
  if (!isEnabled(pref, row.event_type)) {
    await outboxModel.markCancelled(row.id, 'preference_disabled');
    return 'cancelled';
  }
  const payload = parsePayload(row.payload);
  const text = tpl.buildByEvent(row.event_type, payload);
  if (!text) {
    await outboxModel.markFailed(row.id, 'no_template');
    return 'failed';
  }
  const logBase = {
    outboxId: row.id, recipientType: 'citizen', citizenId: row.citizen_id,
    complaintId: row.complaint_id, channel: 'line', eventType: row.event_type,
  };
  return deliver(row, identity.provider_user_id, text, logBase);
};

// Staff personal DM (individual notification)
const processUserRow = async (row) => {
  const identity = await userIdentityModel.findByUser(row.recipient_user_id, 'line');
  if (!identity?.provider_user_id) {
    await outboxModel.markCancelled(row.id, 'no_line_identity');
    return 'cancelled';
  }
  const pref = await userPrefModel.getByUser(row.recipient_user_id);
  if (!isUserEnabled(pref, row.event_type)) {
    await outboxModel.markCancelled(row.id, 'preference_disabled');
    return 'cancelled';
  }
  const text = tpl.buildStaffByEvent(row.event_type, parsePayload(row.payload));
  if (!text) {
    await outboxModel.markFailed(row.id, 'no_template');
    return 'failed';
  }
  const logBase = {
    outboxId: row.id, recipientType: 'user', recipientUserId: row.recipient_user_id,
    complaintId: row.complaint_id, channel: 'line', eventType: row.event_type,
  };
  return deliver(row, identity.provider_user_id, text, logBase);
};

// Process a single claimed outbox row. Returns an outcome tag for tallying.
const processRow = async (row) => {
  if (row.recipient_type === 'line_group') return processGroupRow(row);
  if (row.recipient_type === 'user') return processUserRow(row);
  return processCitizenRow(row);
};

const runOnce = async () => {
  // Skip entirely when LINE messaging isn't configured — leave rows pending
  if (!messaging.isConfigured()) return;

  try {
    await outboxModel.requeueStale(STALE_PROCESSING_MINUTES);
    const rows = await outboxModel.claimDueBatch(BATCH_SIZE);
    if (!rows.length) return;

    const tally = { sent: 0, retried: 0, failed: 0, cancelled: 0 };
    for (const row of rows) {
      try {
        const outcome = await processRow(row);
        tally[outcome] = (tally[outcome] || 0) + 1;
      } catch (err) {
        // unexpected error → schedule a short retry so the row isn't lost
        console.error(`[OutboxJob] row ${row.id} error:`, err.message);
        try { await outboxModel.markRetry(row.id, BACKOFF_SECONDS[0], `internal: ${err.message}`); } catch { /* ignore */ }
        tally.retried += 1;
      }
    }
    console.log(`[OutboxJob] processed ${rows.length} — sent:${tally.sent} retry:${tally.retried} failed:${tally.failed} cancelled:${tally.cancelled}`);
  } catch (err) {
    console.error('[OutboxJob] run error:', err.message);
  }
};

const startNotificationOutboxJob = () => {
  cron.schedule('* * * * *', runOnce, { timezone: 'Asia/Bangkok' });
  console.log('[OutboxJob] Scheduled every minute');
};

module.exports = { startNotificationOutboxJob, runOnce, processRow, isEnabled, EVENT_PREF_MAP };
