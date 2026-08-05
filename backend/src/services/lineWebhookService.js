'use strict';

const lineGroupModel = require('../models/lineGroupModel');
const webhookEventModel = require('../models/lineWebhookEventModel');
const messaging = require('./lineMessagingService');
const botService = require('./lineBotService');
const { writeAuditLog } = require('../middleware/auditLog');

const scopeLabel = (scope) => (scope === 'center' ? 'ศูนย์ดำรงธรรม' : 'หน่วยงาน');

// Handle a single LINE webhook event. Never throws.
const handleEvent = async (event) => {
  const source = event.source || {};

  // 1:1 chat with a citizen → complaint intake / tracking / extra documents
  if (source.type === 'user') {
    await botService.handleUserEvent(event);
    return;
  }

  // group text message → try to bind via a pairing code
  if (event.type === 'message' && source.type === 'group' && event.message?.type === 'text') {
    const groupId = source.groupId;
    const code = String(event.message.text || '').trim().toUpperCase();
    if (!code) return;

    const pairing = await lineGroupModel.findValidPairingCode(code);
    if (!pairing) return; // ignore non-code chatter (no noise)

    const target = await lineGroupModel.upsertTarget({
      scope: pairing.scope, agencyId: pairing.agency_id, groupId,
      label: pairing.label, boundBy: pairing.created_by,
    });
    await lineGroupModel.markPairingCodeUsed(pairing.id, groupId);
    writeAuditLog({
      userId: null, action: 'LINE_GROUP_BOUND', resource: 'line_group', resourceId: target.id,
      details: { scope: pairing.scope, agency_id: pairing.agency_id },
    });
    if (event.replyToken) {
      await messaging.replyText(event.replyToken,
        `✅ เชื่อมต่อกลุ่มนี้กับ "${pairing.label || scopeLabel(pairing.scope)}" สำเร็จ จะได้รับแจ้งเตือนความคืบหน้าเรื่องร้องเรียนที่นี่`);
    }
    return;
  }

  // bot removed from group → disable that target
  if (event.type === 'leave' && source.type === 'group') {
    const disabled = await lineGroupModel.disableTargetByGroup(source.groupId);
    if (disabled) {
      writeAuditLog({
        userId: null, action: 'LINE_GROUP_UNBOUND', resource: 'line_group',
        details: { reason: 'bot_left_group' },
      });
    }
    return;
  }

  // bot invited to group → prompt for a pairing code
  if (event.type === 'join' && source.type === 'group' && event.replyToken) {
    await messaging.replyText(event.replyToken,
      'สวัสดีค่ะ กรุณาพิมพ์ "รหัสจับคู่" ที่ได้จากระบบศูนย์ดำรงธรรม เพื่อเชื่อมต่อกลุ่มนี้กับหน่วยงาน');
  }
};

const handleEvents = async (events = []) => {
  for (const event of events) {
    try {
      // Idempotency: LINE redelivers events on timeout/5xx — process each once.
      const fresh = await webhookEventModel.claim({
        webhookEventId: event.webhookEventId,
        eventType: event.type,
        sourceType: event.source?.type,
      });
      if (!fresh) {
        console.log('[LineWebhook] duplicate event skipped');
        continue;
      }
      try {
        await handleEvent(event);
      } catch (err) {
        // ปล่อย claim คืน เพื่อให้ LINE ส่งซ้ำแล้วประมวลผลใหม่ได้
        await webhookEventModel.release(event.webhookEventId).catch(() => {});
        throw err;
      }
    } catch (err) {
      // ห้าม log payload/ข้อมูลส่วนบุคคล — เก็บเฉพาะประเภท event + ข้อความ error
      console.error(`[LineWebhook] event error (${event?.type}):`, err.message);
    }
  }
};

module.exports = { handleEvents, handleEvent };
