'use strict';

const { config, privacyNoticeUrl } = require('../config/line');
const { statusLabel } = require('./lineMessageTemplate');

// ข้อความสำหรับประชาชนในห้องแชต LINE — ภาษาไทยสุภาพ กระชับ
// PRIVACY (§18): ห้ามใส่เลขบัตรประชาชน ชื่อผู้ถูกร้อง หรือบันทึกภายในของเจ้าหน้าที่
// ในข้อความใด ๆ ที่ส่งออกจากไฟล์นี้ — ส่งได้เฉพาะข้อมูลของผู้ร้องเองที่จำเป็น

const MAX_QUICK_REPLIES = 13; // LINE limit

// postback payload: "a=<action>&<params>" — parse/serialize คู่กับ lineFlowMachine
const pb = (action, params = {}) => {
  const usp = new URLSearchParams({ a: action });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  }
  return usp.toString();
};

const parsePostback = (data) => {
  const usp = new URLSearchParams(String(data || ''));
  const out = {};
  for (const [k, v] of usp.entries()) out[k] = v;
  return { action: out.a || '', params: out };
};

const qrItem = (label, data, displayText) => ({
  type: 'action',
  action: { type: 'postback', label: String(label).slice(0, 20), data, displayText: displayText || label },
});

const withQuickReply = (text, items = []) => {
  const msg = { type: 'text', text };
  const list = items.filter(Boolean).slice(0, MAX_QUICK_REPLIES);
  if (list.length) msg.quickReply = { items: list };
  return msg;
};

const text = (t) => ({ type: 'text', text: t });

// ปุ่มควบคุมที่ใช้ได้ทุกขั้นตอนของ wizard
const NAV_BACK = qrItem('◀ ย้อนกลับ', pb('back'));
const NAV_CANCEL = qrItem('✖ ยกเลิก', pb('cancel'));
const NAV_SKIP = qrItem('ข้ามขั้นตอนนี้', pb('skip'));

// ── เมนูหลัก / ข้อความทั่วไป ────────────────────────────────────────────────
const MENU_ITEMS = [
  qrItem('📝 แจ้งเรื่องร้องเรียน', pb('start')),
  qrItem('🔎 ติดตามสถานะ', pb('track')),
  qrItem('📎 เพิ่มข้อมูล/เอกสาร', pb('more_info')),
  qrItem('☎️ ติดต่อเจ้าหน้าที่', pb('contact')),
  qrItem('📖 คู่มือการร้องเรียน', pb('guide')),
];

const mainMenu = (lead) =>
  withQuickReply(
    lead ||
      'ศูนย์ดำรงธรรมจังหวัดศรีสะเกษยินดีให้บริการค่ะ\nกรุณาเลือกเมนูที่ต้องการด้านล่าง',
    MENU_ITEMS
  );

const welcome = () => [
  text(
    'สวัสดีค่ะ ยินดีต้อนรับสู่ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ\n\n' +
      'ท่านสามารถแจ้งเรื่องร้องเรียน/ร้องทุกข์ ติดตามสถานะ และส่งเอกสารเพิ่มเติมได้ผ่านช่องทางนี้'
  ),
  mainMenu('กรุณาเลือกบริการที่ต้องการค่ะ'),
];

const guide = () =>
  mainMenu(
    '📖 คู่มือการร้องเรียนผ่าน LINE\n\n' +
      '1) กด "แจ้งเรื่องร้องเรียน" แล้วตอบคำถามทีละขั้นตอน\n' +
      '2) ระบบจะสรุปข้อมูลให้ตรวจสอบก่อนส่ง\n' +
      '3) เมื่อยืนยัน ระบบจะแจ้ง "เลขที่รับเรื่อง" กลับให้ทันที\n' +
      '4) ใช้ "ติดตามสถานะ" เพื่อดูความคืบหน้า\n' +
      '5) หากเจ้าหน้าที่ขอข้อมูลเพิ่ม ให้กด "เพิ่มข้อมูล/เอกสาร"\n\n' +
      'ระหว่างกรอก พิมพ์ "ยกเลิก" เพื่อหยุด หรือ "ย้อนกลับ" เพื่อกลับไปขั้นก่อนหน้าได้ตลอด\n\n' +
      'ขอบเขตบริการ: รับเรื่องร้องเรียน/ร้องทุกข์ในพื้นที่จังหวัดศรีสะเกษ\n' +
      '⚠️ กรณีเหตุฉุกเฉินหรืออันตรายถึงชีวิต กรุณาโทร 191 หรือ 1567 ทันที'
  );

const contact = () =>
  mainMenu(
    '☎️ ติดต่อเจ้าหน้าที่\n\n' +
      'ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ (ศาลากลางจังหวัด)\n' +
      'สายด่วน 1567 (ตลอด 24 ชั่วโมง)\n' +
      'เวลาราชการ: จันทร์–ศุกร์ 08.30–16.30 น.\n\n' +
      'หากต้องการให้เจ้าหน้าที่ติดต่อกลับเรื่องที่ท่านแจ้งไว้ กรุณาแจ้งเลขที่รับเรื่องด้วยค่ะ'
  );

const unknownInput = () =>
  mainMenu('ขออภัยค่ะ ระบบไม่เข้าใจคำสั่งนี้\nกรุณาเลือกจากเมนูด้านล่าง');

// ── ขั้นตอนรับเรื่อง (wizard) ───────────────────────────────────────────────
const consentPrompt = () =>
  withQuickReply(
    '📝 แจ้งเรื่องร้องเรียน\n\n' +
      'ขอบเขตบริการ: รับเรื่องร้องเรียน/ร้องทุกข์ ในพื้นที่จังหวัดศรีสะเกษ เพื่อส่งต่อหน่วยงานที่รับผิดชอบ\n\n' +
      '🔒 ประกาศความเป็นส่วนตัว (ฉบับย่อ)\n' +
      'ศูนย์ดำรงธรรมจะเก็บและใช้ข้อมูลที่ท่านแจ้ง (ชื่อ เบอร์ติดต่อ รายละเอียดเหตุการณ์ และไฟล์แนบ) ' +
      'เพื่อรับเรื่อง ตรวจสอบ ส่งต่อหน่วยงาน และแจ้งผลกลับเท่านั้น ' +
      'ข้อมูลจะถูกเก็บเป็นความลับตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล\n\n' +
      '⚠️ เพื่อความปลอดภัย กรุณาอย่าส่งเลขบัตรประชาชนหรือข้อมูลอ่อนไหวทางแชต\n\n' +
      `อ่านฉบับเต็ม: ${privacyNoticeUrl()}\n\n` +
      'ท่านยอมรับเงื่อนไขข้างต้นหรือไม่',
    [
      qrItem('✅ ยอมรับ', pb('consent', { v: 'accept' }), 'ยอมรับ'),
      qrItem('✖ ไม่ยอมรับ', pb('consent', { v: 'decline' }), 'ไม่ยอมรับ'),
    ]
  );

const consentDeclined = () =>
  mainMenu(
    'รับทราบค่ะ ระบบไม่ได้บันทึกข้อมูลของท่าน\n' +
      'หากต้องการร้องเรียนโดยไม่ผ่าน LINE กรุณาโทร 1567 หรือติดต่อศูนย์ดำรงธรรมจังหวัดได้ในเวลาราชการ'
  );

const categoryPrompt = (categories = []) =>
  withQuickReply(
    'ขั้นที่ 1/9 — กรุณาเลือก "ประเภทเรื่อง" ที่ตรงกับเรื่องของท่านมากที่สุดค่ะ',
    [
      ...categories.slice(0, MAX_QUICK_REPLIES - 1).map((c) => qrItem(c.name, pb('category', { id: c.id }), c.name)),
      NAV_CANCEL,
    ]
  );

const districtPrompt = (districts = []) => [
  text(
    'ขั้นที่ 2/9 — สถานที่เกิดเหตุอยู่ "อำเภอ" ใดคะ\n\n' +
      'กรุณาพิมพ์ชื่ออำเภอ หรือส่งตำแหน่งที่ตั้ง (แนบ > ตำแหน่ง) ก็ได้ค่ะ\n\n' +
      `อำเภอในจังหวัดศรีสะเกษ:\n${districts.map((d) => d.name).join(' · ')}`
  ),
  withQuickReply('พิมพ์ชื่ออำเภอได้เลยค่ะ', [NAV_BACK, NAV_CANCEL]),
];

const districtNotFound = () =>
  withQuickReply(
    'ขออภัยค่ะ ไม่พบชื่ออำเภอที่ท่านพิมพ์ในจังหวัดศรีสะเกษ\nกรุณาพิมพ์ใหม่อีกครั้ง (เช่น เมืองศรีสะเกษ, กันทรลักษ์)',
    [NAV_BACK, NAV_CANCEL]
  );

const subdistrictPrompt = (districtName, subdistricts = []) => [
  text(
    `ขั้นที่ 3/9 — อำเภอ${districtName} · กรุณาพิมพ์ชื่อ "ตำบล" ที่เกิดเหตุ\n\n` +
      `ตำบลในอำเภอนี้:\n${subdistricts.map((s) => s.name).join(' · ')}`
  ),
  withQuickReply('หากไม่ทราบตำบล กด "ข้ามขั้นตอนนี้" ได้ค่ะ', [NAV_SKIP, NAV_BACK, NAV_CANCEL]),
];

const subdistrictNotFound = () =>
  withQuickReply('ไม่พบชื่อตำบลนี้ในอำเภอที่เลือกค่ะ กรุณาพิมพ์ใหม่ หรือกด "ข้ามขั้นตอนนี้"', [
    NAV_SKIP, NAV_BACK, NAV_CANCEL,
  ]);

const addressPrompt = () =>
  withQuickReply(
    'ขั้นที่ 4/9 — กรุณาระบุสถานที่เกิดเหตุโดยละเอียด (เช่น หมู่บ้าน ถนน จุดสังเกต)\nหากไม่มีข้อมูลเพิ่มเติม กด "ข้ามขั้นตอนนี้" ได้ค่ะ',
    [NAV_SKIP, NAV_BACK, NAV_CANCEL]
  );

const titlePrompt = () =>
  withQuickReply('ขั้นที่ 5/9 — กรุณาพิมพ์ "หัวข้อเรื่อง" สั้น ๆ (เช่น ถนนชำรุดเป็นหลุมบ่อ)', [
    NAV_BACK, NAV_CANCEL,
  ]);

const detailPrompt = () =>
  withQuickReply(
    'ขั้นที่ 6/9 — กรุณาเล่า "รายละเอียดเหตุการณ์" ว่าเกิดอะไรขึ้น เมื่อใด และได้รับผลกระทบอย่างไร',
    [NAV_BACK, NAV_CANCEL]
  );

const targetPrompt = () =>
  withQuickReply(
    'ขั้นที่ 7/9 — มีหน่วยงานหรือผู้เกี่ยวข้องที่ท่านต้องการระบุหรือไม่คะ\nหากมี กรุณาพิมพ์ หากไม่มี กด "ข้ามขั้นตอนนี้"',
    [NAV_SKIP, NAV_BACK, NAV_CANCEL]
  );

const requestPrompt = () =>
  withQuickReply(
    'ขั้นที่ 8/9 — ท่านต้องการให้ศูนย์ดำรงธรรมช่วยเหลืออย่างไรคะ (เช่น ให้ตรวจสอบและซ่อมแซม)',
    [NAV_SKIP, NAV_BACK, NAV_CANCEL]
  );

const anonymityPrompt = () =>
  withQuickReply(
    'ขั้นที่ 9/9 — ท่านต้องการเปิดเผยตัวตนต่อหน่วยงานที่รับผิดชอบหรือไม่คะ\n\n' +
      '• เปิดเผย: หน่วยงานติดต่อกลับได้สะดวก\n' +
      '• ไม่เปิดเผย (ปกปิดชื่อ): ระบบจะปกปิดชื่อและข้อมูลติดต่อจากผู้ที่ไม่มีสิทธิ์เข้าถึง',
    [
      qrItem('เปิดเผยตัวตน', pb('anon', { v: '0' }), 'เปิดเผยตัวตน'),
      qrItem('ไม่เปิดเผยตัวตน', pb('anon', { v: '1' }), 'ไม่เปิดเผยตัวตน'),
      NAV_BACK,
      NAV_CANCEL,
    ]
  );

const namePrompt = () =>
  withQuickReply('กรุณาพิมพ์ "ชื่อ-นามสกุล" ของผู้ร้อง เพื่อให้เจ้าหน้าที่ติดต่อกลับได้ค่ะ', [
    NAV_BACK, NAV_CANCEL,
  ]);

const phonePrompt = () =>
  withQuickReply(
    'กรุณาพิมพ์ "เบอร์โทรศัพท์" ที่ติดต่อได้ (จำเป็นทุกกรณี รวมเรื่องที่ปกปิดตัวตน — ระบบเก็บเป็นความลับ)',
    [NAV_BACK, NAV_CANCEL]
  );

const phoneInvalid = () =>
  withQuickReply('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้องค่ะ กรุณาพิมพ์เฉพาะตัวเลข 9–10 หลัก (เช่น 0812345678)', [
    NAV_BACK, NAV_CANCEL,
  ]);

const tooLong = (label, max) =>
  withQuickReply(`ข้อความ "${label}" ยาวเกินไปค่ะ (ไม่เกิน ${max} ตัวอักษร) กรุณาพิมพ์ใหม่โดยย่อ`, [
    NAV_BACK, NAV_CANCEL,
  ]);

const emptyInput = () =>
  withQuickReply('กรุณาพิมพ์ข้อความค่ะ หรือกด "ย้อนกลับ" เพื่อกลับไปขั้นก่อนหน้า', [NAV_BACK, NAV_CANCEL]);

const attachmentPrompt = (count = 0) =>
  withQuickReply(
    count === 0
      ? 'ท่านต้องการแนบรูปภาพหรือเอกสารประกอบหรือไม่คะ\nส่งไฟล์เข้ามาในแชตนี้ได้เลย (รูปภาพ/PDF/Word ไม่เกิน 10 MB ต่อไฟล์)\nหากไม่มี กด "ไม่แนบไฟล์"'
      : `รับไฟล์แล้ว ${count} ไฟล์ค่ะ ส่งเพิ่มได้ หรือกด "ถัดไป" เพื่อตรวจสอบข้อมูลสรุป`,
    [
      qrItem(count === 0 ? 'ไม่แนบไฟล์' : '➡️ ถัดไป', pb('attach_done')),
      NAV_BACK,
      NAV_CANCEL,
    ]
  );

const attachmentRejected = (reason) =>
  withQuickReply(`ไม่สามารถรับไฟล์นี้ได้ค่ะ (${reason})\nรองรับ jpg, png, pdf, doc, docx ขนาดไม่เกิน 10 MB`, [
    qrItem('➡️ ถัดไป', pb('attach_done')),
    NAV_CANCEL,
  ]);

const anonLabel = (v) => (v ? 'ไม่เปิดเผยตัวตน' : 'เปิดเผยตัวตน');

const summary = (draft = {}) =>
  withQuickReply(
    '📋 กรุณาตรวจสอบข้อมูลก่อนส่งเรื่องค่ะ\n\n' +
      `ประเภทเรื่อง: ${draft.category_name || '-'}\n` +
      `พื้นที่: ${[draft.subdistrict_name && `ต.${draft.subdistrict_name}`, draft.district_name && `อ.${draft.district_name}`, 'จ.ศรีสะเกษ'].filter(Boolean).join(' ')}\n` +
      `${draft.incident_address ? `สถานที่: ${draft.incident_address}\n` : ''}` +
      `${draft.latitude && draft.longitude ? 'พิกัด: แนบแล้ว\n' : ''}` +
      `หัวข้อ: ${draft.title || '-'}\n` +
      `รายละเอียด: ${draft.description || '-'}\n` +
      `${draft.target_note ? `ผู้เกี่ยวข้อง: ${draft.target_note}\n` : ''}` +
      `${draft.request_note ? `สิ่งที่ต้องการ: ${draft.request_note}\n` : ''}` +
      `ผู้ร้อง: ${draft.is_anonymous ? '[ปกปิดตัวตน]' : draft.complainant_name || '-'}\n` +
      `เบอร์ติดต่อ: ${draft.complainant_phone || '-'}\n` +
      `การเปิดเผยตัวตน: ${anonLabel(draft.is_anonymous)}\n` +
      `ไฟล์แนบ: ${(draft.attachments || []).length} ไฟล์`,
    [
      qrItem('✅ ยืนยันส่งเรื่อง', pb('confirm'), 'ยืนยันส่งเรื่อง'),
      qrItem('✏️ แก้ไข (เริ่มใหม่)', pb('restart'), 'เริ่มกรอกใหม่'),
      NAV_CANCEL,
    ]
  );

const submitted = ({ complaintNumber, receivedDate }) => [
  text(
    'ระบบได้รับเรื่องของท่านแล้ว\n\n' +
      `เลขที่รับเรื่อง: ${complaintNumber}\n` +
      `วันที่รับเรื่อง: ${receivedDate}\n` +
      'สถานะ: รับเรื่องแล้ว\n\n' +
      'ท่านสามารถกด "ติดตามสถานะ" เพื่อตรวจสอบความคืบหน้าได้ตลอดเวลา'
  ),
  mainMenu('มีเรื่องอื่นให้ช่วยเหลือเพิ่มเติมหรือไม่คะ'),
];

const submitFailed = () =>
  mainMenu(
    'ขออภัยค่ะ ระบบไม่สามารถบันทึกเรื่องของท่านได้ในขณะนี้ จึงยังไม่ถือว่ารับเรื่อง\n' +
      'กรุณาลองใหม่อีกครั้ง หรือโทร 1567 เพื่อแจ้งเจ้าหน้าที่โดยตรง'
  );

const cancelled = () =>
  mainMenu('ยกเลิกการแจ้งเรื่องแล้วค่ะ ข้อมูลที่กรอกไว้ถูกลบออกจากระบบเรียบร้อย');

const sessionExpired = () =>
  mainMenu('เนื่องจากไม่มีการตอบกลับเป็นเวลานาน ระบบได้ยกเลิกการกรอกข้อมูลเดิมแล้วค่ะ กรุณาเริ่มใหม่อีกครั้ง');

// ── ติดตามสถานะ ─────────────────────────────────────────────────────────────
const noComplaints = () =>
  mainMenu(
    'ยังไม่พบเรื่องร้องเรียนที่ผูกกับบัญชี LINE นี้ค่ะ\n' +
      'หากท่านเคยยื่นเรื่องผ่านช่องทางอื่น กรุณาติดต่อเจ้าหน้าที่ที่สายด่วน 1567 เพื่อยืนยันตัวตนและผูกเรื่องเข้ากับบัญชีของท่าน'
  );

const trackList = (complaints = []) =>
  withQuickReply(
    '🔎 เรื่องร้องเรียนของท่าน\n\n' +
      complaints
        .map((c, i) => `${i + 1}) ${c.complaint_number}\n   ${c.title}\n   สถานะ: ${statusLabel(c.status)}`)
        .join('\n\n') +
      '\n\nกรุณาเลือกเรื่องที่ต้องการดูรายละเอียด',
    [
      ...complaints.slice(0, MAX_QUICK_REPLIES - 1).map((c) => qrItem(c.complaint_number, pb('track_view', { id: c.id }), c.complaint_number)),
      qrItem('เมนูหลัก', pb('menu')),
    ]
  );

// แสดงเฉพาะข้อมูลที่ประชาชนเห็นได้ — ไม่มีบันทึกภายใน/ชื่อผู้ถูกร้อง
const statusDetail = ({ complaint, agencyName, publicUpdate }) =>
  mainMenu(
    `🔎 เรื่องเลขที่ ${complaint.complaint_number}\n\n` +
      `หัวข้อ: ${complaint.title}\n` +
      `สถานะล่าสุด: ${statusLabel(complaint.status)}\n` +
      `อัปเดตล่าสุด: ${complaint.updated_at_th}\n` +
      `${agencyName ? `หน่วยงานที่รับผิดชอบ: ${agencyName}\n` : ''}` +
      `${complaint.due_date_th ? `กำหนดแล้วเสร็จ: ${complaint.due_date_th}\n` : ''}` +
      `${publicUpdate ? `\nความคืบหน้า:\n${publicUpdate}\n` : ''}` +
      `\nดูรายละเอียดเพิ่มเติม (ต้องเข้าสู่ระบบ):\n${config.frontendUrl}/citizen/complaints/${encodeURIComponent(complaint.complaint_number)}`
  );

// ── ขอข้อมูล/เอกสารเพิ่มเติม ────────────────────────────────────────────────
const noPendingInfoRequests = () =>
  mainMenu('ขณะนี้ไม่มีคำขอข้อมูลเพิ่มเติมที่รอการตอบกลับค่ะ\nหากต้องการส่งเอกสารเพิ่มเติมเอง กรุณาติดต่อเจ้าหน้าที่ที่สายด่วน 1567');

const infoRequestList = (requests = []) =>
  withQuickReply(
    '📎 คำขอข้อมูลเพิ่มเติมที่รอการตอบกลับ\n\n' +
      requests
        .map((r) => `• เรื่อง ${r.complaint_number}\n  ${r.message}${r.due_date_th ? `\n  ภายในวันที่ ${r.due_date_th}` : ''}`)
        .join('\n\n') +
      '\n\nกรุณาเลือกเรื่องที่ต้องการส่งข้อมูล',
    [
      ...requests.slice(0, MAX_QUICK_REPLIES - 1).map((r) => qrItem(r.complaint_number, pb('info_reply', { id: r.id }), r.complaint_number)),
      qrItem('เมนูหลัก', pb('menu')),
    ]
  );

const infoReplyPrompt = ({ complaintNumber, message, dueDateTh }) =>
  withQuickReply(
    `📎 ส่งข้อมูลเพิ่มเติม — เรื่อง ${complaintNumber}\n\n` +
      `รายการที่เจ้าหน้าที่ขอ:\n${message}\n` +
      `${dueDateTh ? `\nกรุณาส่งภายในวันที่ ${dueDateTh}\n` : ''}` +
      '\nท่านสามารถพิมพ์ข้อความ หรือส่งรูปภาพ/เอกสารเข้ามาในแชตนี้ได้เลยค่ะ\nเมื่อส่งครบแล้วกด "ส่งข้อมูลเสร็จสิ้น"',
    [qrItem('✅ ส่งข้อมูลเสร็จสิ้น', pb('info_done')), NAV_CANCEL]
  );

const infoReplyReceived = (count) =>
  withQuickReply(
    `รับข้อมูลแล้ว (${count} รายการ) ค่ะ ส่งเพิ่มได้ หรือกด "ส่งข้อมูลเสร็จสิ้น" เมื่อครบถ้วน`,
    [qrItem('✅ ส่งข้อมูลเสร็จสิ้น', pb('info_done')), NAV_CANCEL]
  );

const infoReplyDone = (complaintNumber) =>
  mainMenu(
    `ขอบคุณค่ะ ระบบได้ส่งข้อมูลเพิ่มเติมของท่านให้เจ้าหน้าที่ผู้รับผิดชอบเรื่อง ${complaintNumber} แล้ว\n` +
      'เจ้าหน้าที่จะตรวจสอบและแจ้งความคืบหน้าให้ทราบต่อไป'
  );

const infoReplyEmpty = () =>
  withQuickReply('ยังไม่ได้รับข้อมูลหรือไฟล์จากท่านค่ะ กรุณาพิมพ์ข้อความหรือส่งไฟล์ก่อนกดเสร็จสิ้น', [
    qrItem('✅ ส่งข้อมูลเสร็จสิ้น', pb('info_done')),
    NAV_CANCEL,
  ]);

module.exports = {
  MAX_QUICK_REPLIES,
  pb, parsePostback, qrItem, withQuickReply, text,
  mainMenu, welcome, guide, contact, unknownInput,
  consentPrompt, consentDeclined,
  categoryPrompt, districtPrompt, districtNotFound,
  subdistrictPrompt, subdistrictNotFound, addressPrompt,
  titlePrompt, detailPrompt, targetPrompt, requestPrompt,
  anonymityPrompt, namePrompt, phonePrompt, phoneInvalid,
  tooLong, emptyInput,
  attachmentPrompt, attachmentRejected,
  summary, submitted, submitFailed, cancelled, sessionExpired,
  noComplaints, trackList, statusDetail,
  noPendingInfoRequests, infoRequestList, infoReplyPrompt,
  infoReplyReceived, infoReplyDone, infoReplyEmpty,
};
