'use strict';

const cron = require('node-cron');
const conversationModel = require('../models/lineConversationModel');
const webhookEventModel = require('../models/lineWebhookEventModel');
const intake = require('../services/lineIntakeService');
const pool = require('../config/database');

// งานดูแลข้อมูล LINE ตามนโยบายเก็บรักษาข้อมูล (data retention)
// - ร่างเรื่องที่ค้างเกิน TTL → ลบข้อมูลส่วนบุคคลในร่าง + ไฟล์ที่ยังไม่ผูกกับเรื่อง
// - webhook event id เก่า → ลบ (เกินช่วง redelivery ของ LINE แล้ว)
const WEBHOOK_EVENT_RETENTION_DAYS = 30;
const IDLE_CONVERSATION_RETENTION_DAYS = 90;

const runOnce = async () => {
  try {
    // ไฟล์ของร่างที่หมดอายุต้องถูกลบก่อน แล้วจึงล้างร่างในฐานข้อมูล
    const [stale] = await pool.query(
      `SELECT line_user_id, draft FROM line_conversations
       WHERE expires_at IS NOT NULL AND expires_at < NOW() AND draft IS NOT NULL`
    );
    for (const row of stale) {
      let draft = null;
      try { draft = typeof row.draft === 'string' ? JSON.parse(row.draft) : row.draft; } catch { draft = null; }
      await intake.discardDraftFiles(draft?.attachments || []);
    }

    const expired = await conversationModel.expireStale();
    const purgedIdle = await conversationModel.purgeIdle(IDLE_CONVERSATION_RETENTION_DAYS);
    const purgedEvents = await webhookEventModel.purgeOlderThan(WEBHOOK_EVENT_RETENTION_DAYS);

    if (expired || purgedIdle || purgedEvents) {
      console.log(`[LineMaintenance] expired drafts:${expired} idle rows:${purgedIdle} webhook ids:${purgedEvents}`);
    }
  } catch (err) {
    console.error('[LineMaintenance] run error:', err.message);
  }
};

const startLineMaintenanceJob = () => {
  // ทุก 15 นาที — เบาและไม่ชนกับ outbox worker (รายนาที)
  cron.schedule('*/15 * * * *', runOnce, { timezone: 'Asia/Bangkok' });
  console.log('[LineMaintenance] Scheduled every 15 minutes');
};

module.exports = { startLineMaintenanceJob, runOnce };
