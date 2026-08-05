import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import intake from '../../src/services/lineIntakeService.js';
import conversationModel from '../../src/models/lineConversationModel.js';
import webhookEventModel from '../../src/models/lineWebhookEventModel.js';
import complaintModel from '../../src/models/complaintModel.js';
import { pool, dbAvailable, createCitizen, cleanupCitizen } from './_helpers.js';

// รับเรื่องผ่าน LINE → ต้องลงในระบบเดิม (complaints + เลขที่เรื่องเดิม + ช่องทาง LINE)
const DB = await dbAvailable();

const LINE_SUB = 'Uitest_intake_0001';
let citizenId;
const createdComplaints = [];

const draft = (over = {}) => ({
  category_id: null,
  district_id: null,
  title: 'ITEST ถนนชำรุด',
  description: 'มีหลุมบ่อขนาดใหญ่',
  target_note: 'แขวงทางหลวง',
  request_note: 'ขอให้ซ่อมแซม',
  complainant_name: 'ITEST ผู้ร้อง',
  complainant_phone: '0812345678',
  is_anonymous: false,
  attachments: [],
  ...over,
});

beforeAll(async () => {
  if (!DB) return;
  citizenId = await createCitizen({ lineSub: LINE_SUB });
});

afterAll(async () => {
  if (!DB) return;
  await pool.query('DELETE FROM line_conversations WHERE line_user_id LIKE "Uitest%"');
  await pool.query('DELETE FROM line_webhook_events WHERE webhook_event_id LIKE "itest%"');
  if (citizenId) await cleanupCitizen(citizenId);
});

(DB ? describe : describe.skip)('LINE intake → ระบบเดิม', () => {
  it('สร้างเรื่องด้วยเลขที่รับเรื่องรูปแบบเดิม และช่องทางเป็น LINE', async () => {
    const complaint = await intake.createComplaintFromDraft({ citizenId, draft: draft(), lineUserId: LINE_SUB });
    createdComplaints.push(complaint.id);

    expect(complaint.complaint_number).toMatch(/^DC-\d{6}-\d{4}$/);
    expect(complaint.channel_name).toBe(intake.LINE_CHANNEL_NAME);
    expect(complaint.status).toBe('NEW');
    expect(complaint.source).toBe('PUBLIC');
    expect(complaint.citizen_id).toBe(citizenId);
    // ข้อมูลที่ถามใน wizard แต่ไม่มีคอลัมน์แยก ถูกรวมไว้ในรายละเอียด
    expect(complaint.description).toContain('แขวงทางหลวง');
    expect(complaint.description).toContain('ขอให้ซ่อมแซม');
  });

  it('บันทึก status log เริ่มต้น (ประวัติของระบบเดิมทำงานตามปกติ)', async () => {
    const [logs] = await pool.query(
      'SELECT to_status FROM complaint_status_logs WHERE complaint_id = ?',
      [createdComplaints[0]]
    );
    expect(logs.map((l) => l.to_status)).toContain('NEW');
  });

  it('เรื่องปกปิดตัวตนไม่บันทึกชื่อผู้ร้อง แต่ยังบันทึกเบอร์ติดต่อ (BR-16)', async () => {
    const complaint = await intake.createComplaintFromDraft({
      citizenId, draft: draft({ is_anonymous: true }), lineUserId: LINE_SUB,
    });
    createdComplaints.push(complaint.id);

    const raw = await complaintModel.findByIdUnmasked(complaint.id);
    expect(raw.is_anonymous).toBe(1);
    expect(raw.complainant_name).toBeNull();
    expect(raw.complainant_phone).toBe('0812345678');
  });

  it('ไม่บันทึกเลขบัตรประชาชนจากช่องทาง LINE', async () => {
    const raw = await complaintModel.findByIdUnmasked(createdComplaints[0]);
    expect(raw.complainant_id_card).toBeNull();
  });

  it('เรื่องของ citizen แสดงในรายการติดตามของเจ้าตัว', async () => {
    const { rows } = await complaintModel.findByCitizenId(citizenId, { limit: 20, offset: 0 });
    expect(rows.length).toBe(createdComplaints.length);
  });
});

(DB ? describe : describe.skip)('Webhook idempotency', () => {
  it('event เดิมถูก claim ได้ครั้งเดียว (กัน redelivery สร้างเรื่องซ้ำ)', async () => {
    const id = `itest-evt-${Date.now()}`;
    const first = await webhookEventModel.claim({ webhookEventId: id, eventType: 'message', sourceType: 'user' });
    const second = await webhookEventModel.claim({ webhookEventId: id, eventType: 'message', sourceType: 'user' });
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('ปล่อย claim คืนได้เมื่อประมวลผลล้มเหลว เพื่อให้ LINE ส่งซ้ำแล้วทำใหม่', async () => {
    const id = `itest-evt-rel-${Date.now()}`;
    await webhookEventModel.claim({ webhookEventId: id, eventType: 'postback', sourceType: 'user' });
    await webhookEventModel.release(id);
    expect(await webhookEventModel.claim({ webhookEventId: id, eventType: 'postback', sourceType: 'user' })).toBe(true);
  });

  it('event ที่ไม่มี id (payload เก่า) ยังประมวลผลได้', async () => {
    expect(await webhookEventModel.claim({ webhookEventId: null, eventType: 'follow' })).toBe(true);
  });
});

(DB ? describe : describe.skip)('สถานะบทสนทนา (draft retention)', () => {
  const lineUser = 'Uitest_conv_0001';

  it('บันทึกและอ่านร่างกลับมาได้', async () => {
    await conversationModel.save({
      lineUserId: lineUser, citizenId, state: 'TITLE', draft: { title: 'ITEST' }, context: {}, ttlMinutes: 60,
    });
    const row = await conversationModel.findByLineUser(lineUser);
    expect(row.state).toBe('TITLE');
    expect(row.draft.title).toBe('ITEST');
  });

  it('ล้างร่างเมื่อยกเลิก/ส่งเรื่องแล้ว', async () => {
    await conversationModel.clear(lineUser);
    const row = await conversationModel.findByLineUser(lineUser);
    expect(row.state).toBe('IDLE');
    expect(row.draft).toEqual({});
  });

  it('ร่างที่หมดอายุถูกลบข้อมูลส่วนบุคคลอัตโนมัติ', async () => {
    await conversationModel.save({
      lineUserId: lineUser, citizenId, state: 'DETAIL', draft: { description: 'ITEST ข้อมูลชั่วคราว' }, ttlMinutes: 60,
    });
    await pool.query('UPDATE line_conversations SET expires_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE line_user_id = ?', [lineUser]);

    const affected = await conversationModel.expireStale();
    expect(affected).toBeGreaterThanOrEqual(1);

    const row = await conversationModel.findByLineUser(lineUser);
    expect(row.state).toBe('IDLE');
    expect(row.draft).toEqual({});
  });
});
