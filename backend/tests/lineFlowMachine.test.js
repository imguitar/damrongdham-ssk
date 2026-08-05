import { describe, it, expect } from 'vitest';
import flow from '../src/utils/lineFlowMachine.js';
import messages from '../src/utils/lineBotMessages.js';

// เทสบทสนทนารับเรื่องผ่าน LINE — เป็น pure function จึงไม่ต้องใช้ DB/เครือข่าย

const DATA = {
  categories: [
    { id: 1, name: 'ที่ดิน / ที่สาธารณประโยชน์' },
    { id: 2, name: 'สิ่งแวดล้อม / มลพิษ' },
  ],
  districts: [
    { id: 1, name: 'เมืองศรีสะเกษ' },
    { id: 5, name: 'ขุขันธ์' },
  ],
  subdistricts: [{ id: 9, name: 'ห้วยเหนือ' }],
};

const txt = (text) => ({ kind: 'text', text });
const post = (action, params = {}) => ({ kind: 'postback', postback: { action, params } });

const start = () => ({ state: flow.S.IDLE, draft: flow.emptyDraft(), context: {} });

// เดินบทสนทนาตามลำดับ input แล้วคืน session สุดท้าย
const drive = (inputs, session = start()) =>
  inputs.reduce((s, input) => {
    const out = flow.advance(s, input, DATA);
    return { state: out.state, draft: out.draft, context: out.context, messages: out.messages, effect: out.effect };
  }, session);

const HAPPY_PATH = [
  txt('แจ้งเรื่องร้องเรียน'),
  post('consent', { v: 'accept' }),
  post('category', { id: '2' }),
  txt('ขุขันธ์'),
  txt('ห้วยเหนือ'),
  post('skip'),                    // สถานที่เพิ่มเติม
  txt('น้ำเสียจากโรงงาน'),
  txt('มีน้ำเสียไหลลงคลองสาธารณะ'),
  post('skip'),                    // ผู้เกี่ยวข้อง
  txt('ขอให้ตรวจสอบและแก้ไข'),
  post('anon', { v: '0' }),
  txt('สมชาย ใจดี'),
  txt('081-234-5678'),
  post('attach_done'),
];

describe('LINE intake wizard — happy path', () => {
  it('เดินครบทุกขั้นตอนจนถึงหน้าสรุป พร้อมข้อมูลที่กรอก', () => {
    const s = drive(HAPPY_PATH);
    expect(s.state).toBe(flow.S.CONFIRM);
    expect(s.draft).toMatchObject({
      consent: true,
      category_id: 2,
      district_id: 5,
      subdistrict_id: 9,
      title: 'น้ำเสียจากโรงงาน',
      is_anonymous: false,
      complainant_name: 'สมชาย ใจดี',
      complainant_phone: '0812345678', // ตัดขีดออกแล้ว
    });
  });

  it('กดยืนยันแล้วสั่งให้ service บันทึกเรื่อง (effect=submit)', () => {
    const s = drive([...HAPPY_PATH, post('confirm')]);
    expect(s.effect).toEqual({ type: 'submit' });
  });

  it('ข้อความสรุปแสดงเลขข้อมูลที่กรอกให้ตรวจสอบก่อนส่ง', () => {
    const s = drive(HAPPY_PATH);
    expect(s.messages[0].text).toContain('น้ำเสียจากโรงงาน');
    expect(s.messages[0].text).toContain('0812345678');
  });
});

describe('LINE intake wizard — ยกเลิก / ย้อนกลับ / เริ่มใหม่', () => {
  it('พิมพ์ "ยกเลิก" ระหว่างกรอก → ล้างร่างและกลับเมนู', () => {
    const s = drive([...HAPPY_PATH.slice(0, 5), txt('ยกเลิก')]);
    expect(s.state).toBe(flow.S.IDLE);
    expect(s.effect).toEqual({ type: 'cancel' });
    expect(s.draft.title).toBeUndefined();
  });

  it('กด "ย้อนกลับ" → กลับไปขั้นก่อนหน้าโดยข้อมูลเดิมยังอยู่', () => {
    const s = drive([...HAPPY_PATH.slice(0, 7), post('back')]); // อยู่ขั้น DETAIL แล้วย้อนกลับ
    expect(s.state).toBe(flow.S.TITLE);
    expect(s.draft.district_id).toBe(5);
  });

  it('ย้อนกลับจากขั้นแรกสุด → ออกจากการกรอกเรื่อง', () => {
    const s = drive([txt('แจ้งเรื่องร้องเรียน'), post('consent', { v: 'accept' }), post('back')]);
    expect(s.state).toBe(flow.S.IDLE);
    expect(s.effect).toEqual({ type: 'cancel' });
  });

  it('กด "เริ่มใหม่" ที่หน้าสรุป → กลับไปขั้นเลือกประเภทเรื่องด้วยร่างเปล่า', () => {
    const s = drive([...HAPPY_PATH, post('restart')]);
    expect(s.state).toBe(flow.S.CATEGORY);
    expect(s.draft.title).toBeUndefined();
  });

  it('ไม่ยอมรับประกาศความเป็นส่วนตัว → ไม่เก็บข้อมูลและจบบทสนทนา', () => {
    const s = drive([txt('แจ้งเรื่องร้องเรียน'), post('consent', { v: 'decline' })]);
    expect(s.state).toBe(flow.S.IDLE);
    expect(s.effect).toEqual({ type: 'cancel' });
    expect(s.messages[0].text).toContain('ไม่ได้บันทึกข้อมูล');
  });
});

describe('LINE intake wizard — การตรวจสอบข้อมูล', () => {
  it('ปกปิดตัวตน → ข้ามขั้นถามชื่อ แต่ยังถามเบอร์โทร (BR-16)', () => {
    const anon = [...HAPPY_PATH.slice(0, 10), post('anon', { v: '1' })];
    const s = drive(anon);
    expect(s.state).toBe(flow.S.PHONE);
    expect(s.draft.is_anonymous).toBe(true);
  });

  it('เบอร์โทรผิดรูปแบบ → อยู่ขั้นเดิมและแจ้งให้แก้ไข', () => {
    const s = drive([...HAPPY_PATH.slice(0, 12), txt('12345')]);
    expect(s.state).toBe(flow.S.PHONE);
    expect(s.messages[0].text).toContain('เบอร์โทรศัพท์ไม่ถูกต้อง');
    expect(s.draft.complainant_phone).toBeUndefined();
  });

  it('หัวข้อยาวเกินขีดจำกัดของฐานข้อมูล → ไม่รับและอยู่ขั้นเดิม', () => {
    const s = drive([...HAPPY_PATH.slice(0, 6), txt('ก'.repeat(flow.LIMITS.title + 1))]);
    expect(s.state).toBe(flow.S.TITLE);
    expect(s.draft.title).toBeUndefined();
  });

  it('ชื่ออำเภอที่ไม่มีในจังหวัด → แจ้งให้พิมพ์ใหม่', () => {
    const s = drive([...HAPPY_PATH.slice(0, 3), txt('บางรัก')]);
    expect(s.state).toBe(flow.S.DISTRICT);
    expect(s.messages[0].text).toContain('ไม่พบชื่ออำเภอ');
  });

  it('รับชื่ออำเภอที่มีคำนำหน้า "อ." ได้', () => {
    const s = drive([...HAPPY_PATH.slice(0, 3), txt('อ.เมืองศรีสะเกษ')]);
    expect(s.draft.district_id).toBe(1);
  });

  it('แชร์ตำแหน่งที่ตั้ง → เก็บพิกัดและจับคู่อำเภอจากที่อยู่', () => {
    const s = drive([
      ...HAPPY_PATH.slice(0, 3),
      { kind: 'location', location: { latitude: 15.11, longitude: 104.32, address: 'ต.ห้วยเหนือ อ.ขุขันธ์ จ.ศรีสะเกษ' } },
    ]);
    expect(s.draft.latitude).toBe(15.11);
    expect(s.draft.district_id).toBe(5);
  });

  it('ส่งไฟล์ตอนขั้นแนบเอกสาร → สั่งให้ service ดาวน์โหลดไฟล์', () => {
    const s = drive([...HAPPY_PATH.slice(0, 13), { kind: 'media', media: { messageId: 'm1', fileName: 'a.pdf' } }]);
    expect(s.effect).toEqual({ type: 'attach_media', media: { messageId: 'm1', fileName: 'a.pdf' } });
  });
});

describe('LINE menu commands', () => {
  it('เมนูติดตามสถานะสั่ง effect track_list', () => {
    expect(flow.advance(start(), txt('ติดตามสถานะ'), DATA).effect).toEqual({ type: 'track_list' });
  });

  it('เลือกเรื่องที่ต้องการติดตามส่ง complaintId ให้ service ตรวจสิทธิ์', () => {
    const out = flow.advance(start(), post('track_view', { id: '42' }), DATA);
    expect(out.effect).toEqual({ type: 'track_view', complaintId: 42 });
  });

  it('เมนูเพิ่มข้อมูล/เอกสารสั่ง effect info_list', () => {
    expect(flow.advance(start(), txt('เพิ่มข้อมูล'), DATA).effect).toEqual({ type: 'info_list' });
  });

  it('ข้อความที่ไม่รู้จักตอบด้วยเมนูหลัก ไม่ทำอะไรกับข้อมูล', () => {
    const out = flow.advance(start(), txt('สวัสดี'), DATA);
    expect(out.effect).toBeNull();
    expect(out.messages[0].quickReply.items.length).toBeGreaterThan(0);
  });

  it('postback payload ถูก parse กลับเป็น action + params', () => {
    expect(messages.parsePostback('a=category&id=3')).toEqual({ action: 'category', params: { a: 'category', id: '3' } });
  });
});

describe('LINE info-reply state', () => {
  const session = { state: flow.S.INFO_REPLY, draft: {}, context: { infoRequestId: 7, responseCount: 0 } };

  it('ข้อความที่ผู้ร้องพิมพ์ → effect info_text', () => {
    expect(flow.advance(session, txt('ส่งสำเนาบัตรแล้วครับ'), DATA).effect)
      .toEqual({ type: 'info_text', text: 'ส่งสำเนาบัตรแล้วครับ' });
  });

  it('ไฟล์ที่ส่งมา → effect info_media', () => {
    const out = flow.advance(session, { kind: 'media', media: { messageId: 'm9' } }, DATA);
    expect(out.effect.type).toBe('info_media');
  });

  it('กดเสร็จสิ้น → effect info_done', () => {
    expect(flow.advance(session, post('info_done'), DATA).effect).toEqual({ type: 'info_done' });
  });
});
