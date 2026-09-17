'use strict';

const pool = require('../config/database');
const conversationModel = require('../models/lineConversationModel');
const identityModel = require('../models/citizenIdentityModel');
const complaintModel = require('../models/complaintModel');
const attachmentModel = require('../models/attachmentModel');
const infoRequestModel = require('../models/infoRequestModel');
const identityService = require('./identityService');
const intake = require('./lineIntakeService');
const messaging = require('./lineMessagingService');
const notifSvc = require('./notificationService');
const flow = require('../utils/lineFlowMachine');
const msg = require('../utils/lineBotMessages');
const { formatThaiDate, formatThaiDateTime } = require('../utils/thaiDate');
const { writeAuditLog } = require('../middleware/auditLog');

// บทสนทนา 1:1 ระหว่างประชาชนกับ LINE Official Account
// - ตรรกะขั้นตอนอยู่ใน lineFlowMachine (pure) — ไฟล์นี้ทำเฉพาะ IO
// - ทุกการเข้าถึงข้อมูลเรื่องร้องเรียนตรวจสิทธิ์จาก citizen ที่ผูกกับ LINE userId เสมอ

const SESSION_TTL_MINUTES = 60;
const TRACK_LIST_LIMIT = 10;

// กันสแปม/ยิงถี่จาก LINE user รายคน (นอกเหนือจาก rate limit ระดับ IP ของ webhook)
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_EVENTS = 30;
const rateBuckets = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (v.resetAt <= now) rateBuckets.delete(k);
}, RATE_WINDOW_MS).unref();

const allowEvent = (lineUserId) => {
  const now = Date.now();
  let b = rateBuckets.get(lineUserId);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(lineUserId, b);
  }
  b.count += 1;
  return b.count <= RATE_MAX_EVENTS;
};

const thDate = formatThaiDate;
const thDateTime = formatThaiDateTime;

// ── input mapping ────────────────────────────────────────────────────────────
const toInput = (event) => {
  if (event.type === 'postback') {
    return { kind: 'postback', postback: msg.parsePostback(event.postback?.data) };
  }
  const m = event.message || {};
  switch (m.type) {
    case 'text':
      return { kind: 'text', text: m.text };
    case 'image':
      return { kind: 'media', media: { messageId: m.id, fileName: null, fileSize: null } };
    case 'file':
      return { kind: 'media', media: { messageId: m.id, fileName: m.fileName, fileSize: m.fileSize } };
    case 'location':
      return {
        kind: 'location',
        location: { latitude: m.latitude, longitude: m.longitude, address: m.address || m.title || '' },
      };
    default:
      return null;
  }
};

// ── identity helpers ─────────────────────────────────────────────────────────
// อ่านอย่างเดียว — ไม่สร้างบัญชีให้ผู้ที่ยังไม่ยินยอม privacy notice
const findCitizenId = async (lineUserId) => {
  const identity = await identityModel.findByProvider('line', lineUserId);
  return identity?.citizen_id || null;
};

// สร้าง/ผูกบัญชีเมื่อผู้ใช้ยอมรับประกาศความเป็นส่วนตัวแล้วเท่านั้น
const ensureCitizen = async (lineUserId) => {
  const existing = await findCitizenId(lineUserId);
  if (existing) return existing;
  const profile = await messaging.getProfile(lineUserId);
  const { citizenId } = await identityService.resolveLineIdentity({
    sub: lineUserId,
    displayName: profile?.displayName || null,
    pictureUrl: profile?.pictureUrl || null,
  });
  return citizenId;
};

const recordConsent = async (citizenId) => {
  await pool.query('UPDATE citizens SET consent_at = NOW() WHERE id = ? AND consent_at IS NULL', [citizenId]);
};

// ── ownership-checked reads ──────────────────────────────────────────────────
const ownedComplaint = async (complaintId, citizenId) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.tracking_code, c.title, c.status, c.due_date, c.updated_at, c.closed_summary
     FROM complaints c WHERE c.id = ? AND c.citizen_id = ?`,
    [complaintId, citizenId]
  );
  return rows[0] || null;
};

const responsibleAgency = async (complaintId) => {
  const [[row]] = await pool.query(
    `SELECT a.name FROM complaint_assignments ca
     JOIN agencies a ON a.id = ca.agency_id
     WHERE ca.complaint_id = ? AND ca.is_active = 1
     LIMIT 1`,
    [complaintId]
  );
  return row?.name || null;
};

// เฉพาะความคืบหน้าที่เจ้าหน้าที่ทำเครื่องหมาย "แสดงต่อประชาชน" เท่านั้น
const latestPublicUpdate = async (complaintId) => {
  const [[row]] = await pool.query(
    `SELECT content FROM complaint_updates
     WHERE complaint_id = ? AND is_public = 1
     ORDER BY created_at DESC LIMIT 1`,
    [complaintId]
  );
  return row?.content || null;
};

// ── effects ──────────────────────────────────────────────────────────────────
// คืน { persist } — persist=false แปลว่าล้าง session แล้ว (ยกเลิก/ส่งเรื่องสำเร็จ)
const runEffect = async ({ lineUserId, out, prevDraft }) => {
  const eff = out.effect;
  if (!eff) return { persist: true };

  switch (eff.type) {
    case 'cancel': {
      await intake.discardDraftFiles(prevDraft?.attachments);
      await conversationModel.clear(lineUserId);
      return { persist: false };
    }

    case 'consent_accepted': {
      const citizenId = await ensureCitizen(lineUserId);
      await recordConsent(citizenId);
      out.citizenId = citizenId;
      return { persist: true };
    }

    case 'attach_media': {
      const current = out.draft.attachments || [];
      if (current.length >= intake.MAX_ATTACHMENTS) {
        out.messages = [msg.attachmentRejected(`แนบได้สูงสุด ${intake.MAX_ATTACHMENTS} ไฟล์`)];
        return { persist: true };
      }
      const res = await intake.downloadAndStore(eff.media);
      if (!res.ok) {
        out.messages = [msg.attachmentRejected(res.reason)];
        return { persist: true };
      }
      out.draft = { ...out.draft, attachments: [...current, res.file] };
      out.messages = [msg.attachmentPrompt(out.draft.attachments.length)];
      return { persist: true };
    }

    case 'submit': {
      // บันทึกลงระบบเดิมให้สำเร็จก่อน จึงจะแจ้งเลขที่รับเรื่อง (§2)
      try {
        const citizenId = await ensureCitizen(lineUserId);
        await recordConsent(citizenId);
        const complaint = await intake.createComplaintFromDraft({ citizenId, draft: out.draft, lineUserId });
        out.messages = msg.submitted({
          trackingCode: complaint.tracking_code,
          receivedDate: thDate(complaint.created_at),
        });
        await conversationModel.clear(lineUserId);
        return { persist: false };
      } catch (err) {
        console.error('[LineBot] submit failed:', err.message);
        out.messages = [msg.submitFailed()];
        out.state = flow.S.CONFIRM; // คงร่างไว้ให้กดยืนยันใหม่ได้
        return { persist: true };
      }
    }

    case 'track_list': {
      const citizenId = await findCitizenId(lineUserId);
      if (!citizenId) { out.messages = [msg.noComplaints()]; return { persist: true }; }
      const { rows } = await complaintModel.findByCitizenId(citizenId, { limit: TRACK_LIST_LIMIT, offset: 0 });
      out.messages = rows.length ? [msg.trackList(rows)] : [msg.noComplaints()];
      return { persist: true };
    }

    case 'track_view': {
      const citizenId = await findCitizenId(lineUserId);
      const complaint = citizenId ? await ownedComplaint(eff.complaintId, citizenId) : null;
      // ไม่บอกว่า "ไม่มีสิทธิ์" เพื่อไม่ให้เดาเลขที่เรื่องผู้อื่นได้
      if (!complaint) { out.messages = [msg.noComplaints()]; return { persist: true }; }
      const [agencyName, publicUpdate] = await Promise.all([
        responsibleAgency(complaint.id),
        latestPublicUpdate(complaint.id),
      ]);
      out.messages = [msg.statusDetail({
        complaint: {
          ...complaint,
          updated_at_th: thDateTime(complaint.updated_at),
          due_date_th: complaint.due_date ? thDate(complaint.due_date) : null,
        },
        agencyName,
        publicUpdate: publicUpdate || complaint.closed_summary || null,
      })];
      return { persist: true };
    }

    case 'info_list': {
      const citizenId = await findCitizenId(lineUserId);
      const pending = citizenId ? await infoRequestModel.findPendingByCitizen(citizenId) : [];
      out.messages = pending.length
        ? [msg.infoRequestList(pending.map((r) => ({ ...r, due_date_th: r.due_date ? thDate(r.due_date) : null })))]
        : [msg.noPendingInfoRequests()];
      return { persist: true };
    }

    case 'info_select': {
      const citizenId = await findCitizenId(lineUserId);
      const req = citizenId ? await infoRequestModel.findPendingForCitizen(eff.infoRequestId, citizenId) : null;
      if (!req) { out.messages = [msg.noPendingInfoRequests()]; return { persist: true }; }
      out.state = flow.S.INFO_REPLY;
      out.context = { infoRequestId: req.id, complaintId: req.complaint_id, trackingCode: req.tracking_code, responseCount: 0 };
      out.messages = [msg.infoReplyPrompt({
        trackingCode: req.tracking_code,
        message: req.message,
        dueDateTh: req.due_date ? thDate(req.due_date) : null,
      })];
      return { persist: true };
    }

    case 'info_text': {
      const req = await loadOwnedPendingRequest(lineUserId, out.context.infoRequestId);
      if (!req) { out.messages = [msg.noPendingInfoRequests()]; out.state = flow.S.IDLE; out.context = {}; return { persist: true }; }
      await infoRequestModel.addResponse({
        infoRequestId: req.id, complaintId: req.complaint_id, citizenId: req.citizen_id, message: eff.text,
      });
      out.context = { ...out.context, responseCount: (out.context.responseCount || 0) + 1 };
      out.messages = [msg.infoReplyReceived(out.context.responseCount)];
      return { persist: true };
    }

    case 'info_media': {
      const req = await loadOwnedPendingRequest(lineUserId, out.context.infoRequestId);
      if (!req) { out.messages = [msg.noPendingInfoRequests()]; out.state = flow.S.IDLE; out.context = {}; return { persist: true }; }
      const res = await intake.downloadAndStore(eff.media);
      if (!res.ok) { out.messages = [msg.attachmentRejected(res.reason)]; return { persist: true }; }
      const attachmentId = await attachmentModel.create({
        complaintId: req.complaint_id,
        updateId: null,
        infoRequestId: req.id,
        fileName: res.file.fileName,
        filePath: res.file.storedName,
        fileSize: res.file.size,
        fileType: res.file.mime,
        uploadedBy: null,
        uploadedByCitizen: req.citizen_id,
        uploadSource: 'LINE',
      });
      await infoRequestModel.addResponse({
        infoRequestId: req.id, complaintId: req.complaint_id, citizenId: req.citizen_id, attachmentId,
      });
      out.context = { ...out.context, responseCount: (out.context.responseCount || 0) + 1 };
      out.messages = [msg.infoReplyReceived(out.context.responseCount)];
      return { persist: true };
    }

    case 'info_done': {
      const req = await loadOwnedPendingRequest(lineUserId, out.context.infoRequestId);
      if (!req) { out.messages = [msg.noPendingInfoRequests()]; out.state = flow.S.IDLE; out.context = {}; return { persist: true }; }
      const count = await infoRequestModel.countResponses(req.id);
      if (!count) { out.messages = [msg.infoReplyEmpty()]; return { persist: true }; }

      await infoRequestModel.markResponded(req.id);
      notifSvc.notifyInfoResponse(req.complaint_id, {
        complaint_number: req.complaint_number,
        requestedBy: req.requested_by,
      });
      writeAuditLog({
        userId: null,
        action: 'LINE_INFO_RESPONSE_SUBMITTED',
        resource: 'complaint_info_requests',
        resourceId: req.id,
        details: { complaint_id: req.complaint_id, complaint_number: req.complaint_number, items: count, channel: 'line' },
      });

      out.messages = [msg.infoReplyDone(req.tracking_code)];
      out.state = flow.S.IDLE;
      out.context = {};
      return { persist: true };
    }

    default:
      return { persist: true };
  }
};

// ตรวจสิทธิ์ซ้ำทุกครั้งที่มีการบันทึกข้อมูลตามคำขอ (ไม่เชื่อ session อย่างเดียว)
const loadOwnedPendingRequest = async (lineUserId, infoRequestId) => {
  if (!infoRequestId) return null;
  const citizenId = await findCitizenId(lineUserId);
  if (!citizenId) return null;
  const req = await infoRequestModel.findPendingForCitizen(infoRequestId, citizenId);
  if (!req) return null;
  const full = await infoRequestModel.findById(req.id);
  return full;
};

// ── main handler ─────────────────────────────────────────────────────────────
const reply = async (event, messages) => {
  const list = [].concat(messages || []).filter(Boolean);
  if (!list.length) return;
  if (event.replyToken) {
    const res = await messaging.replyMessages(event.replyToken, list);
    if (res.ok) return;
  }
  // replyToken ใช้ไม่ได้/หมดอายุ → fallback เป็น push
  if (event.source?.userId) {
    await messaging.pushMessages({ to: event.source.userId, messages: list });
  }
};

// LINE ส่ง event ของผู้ใช้คนเดียวกันมาเป็นคนละ request และเราประมวลผลหลัง ack แล้ว
// → ต่อคิวรายผู้ใช้ เพื่อไม่ให้สอง event เขียนทับสถานะบทสนทนากัน (ข้อความหาย/ถามซ้ำ)
// หมายเหตุ: คิวอยู่ใน memory เหมาะกับการรัน instance เดียวตามสถาปัตยกรรมปัจจุบัน
const userQueues = new Map();

const runSerialPerUser = (lineUserId, task) => {
  const prev = userQueues.get(lineUserId) || Promise.resolve();
  const run = prev.catch(() => {}).then(task);
  const settled = run.catch(() => {});
  userQueues.set(lineUserId, settled);
  settled.then(() => {
    if (userQueues.get(lineUserId) === settled) userQueues.delete(lineUserId);
  });
  return run; // ผู้เรียกยังเห็น error จริง (webhook จะปล่อย claim ให้ LINE ส่งซ้ำ)
};

const handleUserEvent = (event) => {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return Promise.resolve();
  if (!allowEvent(lineUserId)) {
    console.warn('[LineBot] rate limited user event');
    return Promise.resolve();
  }
  return runSerialPerUser(lineUserId, () => processUserEvent(event, lineUserId));
};

const processUserEvent = async (event, lineUserId) => {
  if (event.type === 'follow') {
    await reply(event, msg.welcome());
    return;
  }

  if (event.type === 'unfollow') {
    // ผู้ใช้บล็อก/ลบเพื่อน → ล้างร่างที่ค้างอยู่ (data minimisation)
    const session = await conversationModel.findByLineUser(lineUserId);
    if (session) {
      await intake.discardDraftFiles(session.draft?.attachments);
      await conversationModel.clear(lineUserId);
    }
    return;
  }

  if (event.type !== 'message' && event.type !== 'postback') return;

  const input = toInput(event);
  if (!input) {
    await reply(event, msg.unknownInput());
    return;
  }

  const session = await conversationModel.findByLineUser(lineUserId);
  let current = { state: flow.S.IDLE, draft: flow.emptyDraft(), context: {} };
  const prefix = [];

  if (session) {
    const expired = session.expires_at && new Date(session.expires_at).getTime() < Date.now();
    if (expired && session.state !== flow.S.IDLE) {
      await intake.discardDraftFiles(session.draft?.attachments);
      await conversationModel.clear(lineUserId);
      prefix.push(msg.sessionExpired());
    } else if (!expired) {
      current = {
        state: session.state || flow.S.IDLE,
        draft: session.draft && Object.keys(session.draft).length ? session.draft : flow.emptyDraft(),
        context: session.context || {},
      };
    }
  }

  const data = {
    categories: await intake.listCategories(),
    districts: await intake.listDistricts(),
    subdistricts: current.state === flow.S.SUBDISTRICT ? await intake.listSubdistricts(current.draft.district_id) : [],
  };

  const out = flow.advance(current, input, data);

  // เข้าสู่ขั้นตอน "ตำบล" ครั้งแรก → ต้องโหลดตำบลของอำเภอที่เพิ่งเลือก
  if (out.state === flow.S.SUBDISTRICT && current.state !== flow.S.SUBDISTRICT) {
    const subdistricts = await intake.listSubdistricts(out.draft.district_id);
    out.messages = [].concat(flow.promptFor(flow.S.SUBDISTRICT, out.draft, { subdistricts }));
  }

  const { persist } = await runEffect({ lineUserId, out, prevDraft: current.draft });

  if (persist) {
    const citizenId = out.citizenId || (await findCitizenId(lineUserId));
    await conversationModel.save({
      lineUserId,
      citizenId,
      state: out.state,
      draft: out.state === flow.S.IDLE ? null : out.draft,
      context: out.context && Object.keys(out.context).length ? out.context : null,
      ttlMinutes: SESSION_TTL_MINUTES,
    });
  }

  await reply(event, [...prefix, ...out.messages]);
};

module.exports = { handleUserEvent, toInput, thDate, thDateTime, SESSION_TTL_MINUTES };
