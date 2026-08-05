import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import webhookService from '../../src/services/lineWebhookService.js';
import infoRequestModel from '../../src/models/infoRequestModel.js';
import { pool, dbAvailable, createStaffUser, cleanupUser, cleanupComplaint } from './_helpers.js';

// End-to-end: ประชาชนคุยกับ LINE OA → เรื่องเข้าระบบเดิม → ติดตามสถานะ → ส่งข้อมูลเพิ่มเติม
// ใช้ webhook event จริงผ่าน lineWebhookService (มี dedupe) + stub global.fetch แทน LINE API
const DB = await dbAvailable();

const LINE_USER = 'Uitest_e2e_00000001';
const realFetch = global.fetch;
let sent = []; // ข้อความที่ระบบส่งกลับไปยัง LINE

const stubLineApi = () => {
  global.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u.includes('/v2/bot/profile/')) {
      return { ok: true, status: 200, json: async () => ({ displayName: 'ITEST LINE User' }), headers: { get: () => null } };
    }
    if (u.includes('/message/reply') || u.includes('/message/push')) {
      const body = JSON.parse(opts.body || '{}');
      sent.push(...(body.messages || []));
      return { ok: true, status: 200, json: async () => ({ sentMessages: [{ id: 'itest-msg' }] }), text: async () => '', headers: { get: () => null } };
    }
    return { ok: false, status: 404, text: async () => 'not stubbed', headers: { get: () => null } };
  };
};

// รอเงื่อนไขที่เกิดจากงานแบบ fire-and-forget (สูงสุด ~1 วินาที)
const waitFor = async (check, { tries = 20, delayMs = 50 } = {}) => {
  for (let i = 0; i < tries; i += 1) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
};

let eventSeq = 0;
const send = async (event) => {
  sent = [];
  eventSeq += 1;
  await webhookService.handleEvents([{
    webhookEventId: `itest-e2e-${Date.now()}-${eventSeq}`,
    replyToken: `rt-${eventSeq}`,
    source: { type: 'user', userId: LINE_USER },
    ...event,
  }]);
  return sent.map((m) => m.text || '').join('\n');
};

const text = (t) => ({ type: 'message', message: { type: 'text', id: `m${eventSeq}`, text: t } });
const postback = (data) => ({ type: 'postback', postback: { data } });

let categoryId; let staffUserId; let complaintId;

const findCitizenId = async () => {
  const [[row]] = await pool.query(
    'SELECT citizen_id FROM citizen_identities WHERE provider = "line" AND provider_user_id = ?', [LINE_USER]
  );
  return row?.citizen_id || null;
};

beforeAll(async () => {
  if (!DB) return;
  stubLineApi();
  const [[cat]] = await pool.query('SELECT id FROM complaint_categories WHERE is_active = 1 ORDER BY id LIMIT 1');
  categoryId = cat.id;
  staffUserId = await createStaffUser({ roleId: 3 });
});

afterEach(() => { if (DB) stubLineApi(); });

afterAll(async () => {
  global.fetch = realFetch;
  if (!DB) return;
  const citizenId = await findCitizenId();
  if (citizenId) {
    const [complaints] = await pool.query('SELECT id FROM complaints WHERE citizen_id = ?', [citizenId]);
    for (const c of complaints) {
      await pool.query('DELETE FROM complaint_info_responses WHERE complaint_id = ?', [c.id]);
      await pool.query('DELETE FROM complaint_info_requests WHERE complaint_id = ?', [c.id]);
      await cleanupComplaint(c.id);
    }
    await pool.query('DELETE FROM notification_preferences WHERE citizen_id = ?', [citizenId]);
    await pool.query('DELETE FROM citizen_identities WHERE citizen_id = ?', [citizenId]);
    await pool.query('DELETE FROM line_conversations WHERE citizen_id = ?', [citizenId]);
    await pool.query('DELETE FROM citizens WHERE id = ?', [citizenId]);
  }
  await pool.query('DELETE FROM line_conversations WHERE line_user_id = ?', [LINE_USER]);
  await pool.query('DELETE FROM line_webhook_events WHERE webhook_event_id LIKE "itest-e2e%"');
  if (staffUserId) await cleanupUser(staffUserId);
});

(DB ? describe : describe.skip)('E2E: แจ้งเรื่องร้องเรียนผ่าน LINE', () => {
  it('ทักครั้งแรกได้เมนูบริการ (ยังไม่สร้างบัญชีจนกว่าจะยินยอม)', async () => {
    const out = await send(text('สวัสดี'));
    expect(out).toContain('เมนู');
    expect(await findCitizenId()).toBeNull();
  });

  it('กดแจ้งเรื่อง → ได้ประกาศความเป็นส่วนตัวพร้อมลิงก์ฉบับเต็ม', async () => {
    const out = await send(text('แจ้งเรื่องร้องเรียน'));
    expect(out).toContain('ประกาศความเป็นส่วนตัว');
    expect(out).toMatch(/https?:\/\//);
  });

  it('กรอกข้อมูลครบตามขั้นตอนจนถึงหน้าสรุป', async () => {
    expect(await send(postback('a=consent&v=accept'))).toContain('ประเภทเรื่อง');
    expect(await send(postback(`a=category&id=${categoryId}`))).toContain('อำเภอ');
    expect(await send(text('เมืองศรีสะเกษ'))).toContain('ตำบล');
    await send(postback('a=skip'));                    // ตำบล
    await send(postback('a=skip'));                    // สถานที่เพิ่มเติม
    expect(await send(text('ITEST ถนนชำรุด'))).toContain('รายละเอียด');
    await send(text('มีหลุมบ่อขนาดใหญ่หน้าโรงเรียน'));
    await send(postback('a=skip'));                    // ผู้เกี่ยวข้อง
    await send(text('ขอให้ซ่อมแซมโดยเร็ว'));
    await send(postback('a=anon&v=0'));
    await send(text('ITEST ผู้ร้อง'));
    await send(text('0812345678'));
    const summary = await send(postback('a=attach_done'));
    expect(summary).toContain('ITEST ถนนชำรุด');
    expect(summary).toContain('0812345678');
  });

  it('ยืนยันส่งเรื่อง → บันทึกลงระบบเดิมและตอบเลขที่รับเรื่องกลับทาง LINE', async () => {
    const out = await send(postback('a=confirm'));

    const citizenId = await findCitizenId();
    expect(citizenId).toBeTruthy();

    const [[complaint]] = await pool.query(
      `SELECT c.*, ch.name AS channel_name FROM complaints c
       JOIN complaint_channels ch ON ch.id = c.channel_id
       WHERE c.citizen_id = ? ORDER BY c.id DESC LIMIT 1`,
      [citizenId]
    );
    complaintId = complaint.id;

    expect(complaint.complaint_number).toMatch(/^DC-\d{6}-\d{4}$/);
    expect(complaint.channel_name).toBe('LINE Official Account');
    expect(complaint.status).toBe('NEW');
    expect(out).toContain(complaint.complaint_number);
    expect(out).toContain('ระบบได้รับเรื่องของท่านแล้ว');

    // ยินยอม privacy notice ถูกบันทึกไว้
    const [[citizen]] = await pool.query('SELECT consent_at FROM citizens WHERE id = ?', [citizenId]);
    expect(citizen.consent_at).toBeTruthy();
  });

  it('ส่ง webhook event เดิมซ้ำ (redelivery) ไม่สร้างเรื่องซ้ำ', async () => {
    const citizenId = await findCitizenId();
    const duplicate = {
      webhookEventId: 'itest-e2e-duplicate-1',
      replyToken: 'rt-dup',
      source: { type: 'user', userId: LINE_USER },
      ...postback('a=confirm'),
    };
    await webhookService.handleEvents([duplicate]);
    await webhookService.handleEvents([duplicate]);

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM complaints WHERE citizen_id = ?', [citizenId]);
    expect(total).toBe(1);
  });

  it('ติดตามสถานะ: เห็นเฉพาะเรื่องของบัญชี LINE ตนเอง พร้อมสถานะล่าสุด', async () => {
    const list = await send(text('ติดตามสถานะ'));
    const [[complaint]] = await pool.query('SELECT complaint_number FROM complaints WHERE id = ?', [complaintId]);
    expect(list).toContain(complaint.complaint_number);

    const detail = await send(postback(`a=track_view&id=${complaintId}`));
    expect(detail).toContain(complaint.complaint_number);
    expect(detail).toContain('รับเรื่องเข้าระบบแล้ว');
  });

  it('เดาเลขที่เรื่องของผู้อื่นไม่ได้ (ไม่แสดงข้อมูลเรื่องที่ไม่ใช่ของตน)', async () => {
    const [[other]] = await pool.query(
      'SELECT id FROM complaints WHERE citizen_id IS NULL OR citizen_id <> (SELECT citizen_id FROM citizen_identities WHERE provider_user_id = ?) LIMIT 1',
      [LINE_USER]
    );
    if (!other) return; // ไม่มีเรื่องอื่นในฐานข้อมูลทดสอบ
    const out = await send(postback(`a=track_view&id=${other.id}`));
    expect(out).toContain('ยังไม่พบเรื่องร้องเรียน');
    expect(out).not.toMatch(/DC-\d{6}-\d{4}/);
  });
});

(DB ? describe : describe.skip)('E2E: เจ้าหน้าที่ขอข้อมูลเพิ่มเติม → ประชาชนส่งกลับทาง LINE', () => {
  let infoRequestId;

  it('ประชาชนเห็นคำขอที่รอตอบจากเมนู "เพิ่มข้อมูล/เอกสาร"', async () => {
    infoRequestId = await infoRequestModel.create({
      complaintId, requestedBy: staffUserId, message: 'ITEST ขอภาพถ่ายจุดเกิดเหตุเพิ่มเติม',
    });
    const out = await send(text('เพิ่มข้อมูล'));
    expect(out).toContain('ITEST ขอภาพถ่ายจุดเกิดเหตุเพิ่มเติม');
  });

  it('เลือกคำขอแล้วส่งข้อความกลับ → บันทึกผูกกับเรื่องเดิม', async () => {
    expect(await send(postback(`a=info_reply&id=${infoRequestId}`))).toContain('ส่งข้อมูลเพิ่มเติม');
    const out = await send(text('ส่งภาพถ่ายให้แล้วครับ'));
    expect(out).toContain('รับข้อมูลแล้ว');

    const responses = await infoRequestModel.findResponsesByComplaint(complaintId);
    expect(responses.some((r) => r.message === 'ส่งภาพถ่ายให้แล้วครับ')).toBe(true);
  });

  it('กดเสร็จสิ้น → ปิดคำขอและแจ้งเจ้าหน้าที่ผู้ขอในระบบ', async () => {
    const out = await send(postback('a=info_done'));
    expect(out).toContain('ส่งข้อมูลเพิ่มเติมของท่านให้เจ้าหน้าที่');

    const reloaded = await infoRequestModel.findById(infoRequestId);
    expect(reloaded.status).toBe('RESPONDED');

    // การแจ้งเตือนเจ้าหน้าที่เป็น fire-and-forget → รอสั้น ๆ ให้เขียนเสร็จ
    const notified = await waitFor(async () => {
      const [rows] = await pool.query(
        'SELECT type FROM notifications WHERE user_id = ? AND complaint_id = ?', [staffUserId, complaintId]
      );
      return rows.some((n) => n.type === 'INFO_RESPONSE_RECEIVED');
    });
    expect(notified).toBe(true);
  });

  it('ผู้ใช้บล็อก OA (unfollow) → ล้างร่างบทสนทนาที่ค้างไว้', async () => {
    await send(text('แจ้งเรื่องร้องเรียน'));
    await send({ type: 'unfollow' });
    const [[conv]] = await pool.query('SELECT state, draft FROM line_conversations WHERE line_user_id = ?', [LINE_USER]);
    expect(conv.state).toBe('IDLE');
    expect(conv.draft).toBeNull();
  });
});

(DB ? describe : describe.skip)('การประมวลผล event ที่มาพร้อมกันของผู้ใช้คนเดียวกัน', () => {
  const RACE_USER = 'Uitest_e2e_race_0001';
  const raceEvent = (event, id) => webhookService.handleEvents([{
    webhookEventId: `itest-e2e-race-${Date.now()}-${id}`,
    replyToken: `rtr-${id}`,
    source: { type: 'user', userId: RACE_USER },
    ...event,
  }]);

  afterAll(async () => {
    const [[row]] = await pool.query(
      'SELECT citizen_id FROM citizen_identities WHERE provider = "line" AND provider_user_id = ?', [RACE_USER]
    );
    await pool.query('DELETE FROM line_conversations WHERE line_user_id = ?', [RACE_USER]);
    if (row?.citizen_id) {
      await pool.query('DELETE FROM notification_preferences WHERE citizen_id = ?', [row.citizen_id]);
      await pool.query('DELETE FROM citizen_identities WHERE citizen_id = ?', [row.citizen_id]);
      await pool.query('DELETE FROM citizens WHERE id = ?', [row.citizen_id]);
    }
  });

  it('ประมวลผลเรียงตามลำดับ ไม่เขียนทับสถานะบทสนทนากัน', async () => {
    await raceEvent(text('แจ้งเรื่องร้องเรียน'), 'a');
    await raceEvent(postback('a=consent&v=accept'), 'b');

    // ยิงสอง event พร้อมกัน (เหมือนผู้ใช้พิมพ์รัว/LINE ส่งซ้อน)
    await Promise.all([
      raceEvent(postback(`a=category&id=${categoryId}`), 'c'),
      raceEvent(text('เมืองศรีสะเกษ'), 'd'),
    ]);

    // ถ้าไม่มีการต่อคิวรายผู้ใช้ สถานะจะค้างที่ DISTRICT (event หลังอ่าน session เก่า)
    const [[conv]] = await pool.query('SELECT state, draft FROM line_conversations WHERE line_user_id = ?', [RACE_USER]);
    expect(conv.state).toBe('SUBDISTRICT');
    const draft = typeof conv.draft === 'string' ? JSON.parse(conv.draft) : conv.draft;
    expect(draft.category_id).toBe(categoryId);
    expect(draft.district_id).toBeTruthy();
  });
});

