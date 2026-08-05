'use strict';

const msg = require('./lineBotMessages');

// Pure conversation state machine for the LINE complaint wizard.
// No DB / no network here — master data and IO results are passed in, and IO the
// service must perform is returned as an `effect`. This keeps the whole dialogue
// deterministic and unit-testable (see tests/lineFlowMachine.test.js).

const S = {
  IDLE: 'IDLE',
  CONSENT: 'CONSENT',
  CATEGORY: 'CATEGORY',
  DISTRICT: 'DISTRICT',
  SUBDISTRICT: 'SUBDISTRICT',
  ADDRESS: 'ADDRESS',
  TITLE: 'TITLE',
  DETAIL: 'DETAIL',
  TARGET: 'TARGET',
  REQUEST: 'REQUEST',
  ANONYMITY: 'ANONYMITY',
  NAME: 'NAME',
  PHONE: 'PHONE',
  ATTACHMENT: 'ATTACHMENT',
  CONFIRM: 'CONFIRM',
  INFO_REPLY: 'INFO_REPLY',
};

// wizard step order (NAME is skipped for anonymous complaints)
const ORDER = [
  S.CONSENT, S.CATEGORY, S.DISTRICT, S.SUBDISTRICT, S.ADDRESS,
  S.TITLE, S.DETAIL, S.TARGET, S.REQUEST, S.ANONYMITY,
  S.NAME, S.PHONE, S.ATTACHMENT, S.CONFIRM,
];

const LIMITS = {
  title: 500,
  description: 4000,
  address: 500,
  note: 1000,
  name: 255,
};

const PHONE_RE = /^0\d{8,9}$/;

// Rich-menu buttons may send plain text instead of a postback — accept both.
const TEXT_COMMANDS = [
  { re: /^(แจ้งเรื่อง|แจ้งเรื่องร้องเรียน|ร้องเรียน|แจ้งร้องเรียน)$/i, action: 'start' },
  { re: /^(ติดตามสถานะ|ติดตาม|สถานะ|ตรวจสอบสถานะ)$/i, action: 'track' },
  { re: /^(เพิ่มข้อมูล|เพิ่มข้อมูลหรือเอกสาร|เพิ่มข้อมูล\/เอกสาร|ส่งเอกสาร|ส่งข้อมูลเพิ่มเติม)$/i, action: 'more_info' },
  { re: /^(ติดต่อเจ้าหน้าที่|ติดต่อ)$/i, action: 'contact' },
  { re: /^(คู่มือ|คู่มือการร้องเรียน|ช่วยเหลือ|help)$/i, action: 'guide' },
  { re: /^(เมนู|menu|เมนูหลัก)$/i, action: 'menu' },
  { re: /^(ยกเลิก|cancel)$/i, action: 'cancel' },
  { re: /^(ย้อนกลับ|กลับ|back)$/i, action: 'back' },
  { re: /^(เริ่มใหม่|restart)$/i, action: 'restart' },
];

const commandFromText = (t) => {
  const s = String(t || '').trim();
  const hit = TEXT_COMMANDS.find((c) => c.re.test(s));
  return hit ? hit.action : null;
};

const emptyDraft = () => ({ attachments: [] });

const result = (state, draft, context, messages, effect = null) => ({
  state, draft, context: context || {}, messages: [].concat(messages || []), effect,
});

// normalize Thai place names for matching ("อ.เมือง" / "อำเภอเมือง" → "เมือง")
const normalizePlace = (s) =>
  String(s || '').trim().replace(/^(อำเภอ|อ\.|ตำบล|ต\.)\s*/u, '').replace(/\s+/g, '');

const matchPlace = (list, input) => {
  const q = normalizePlace(input);
  if (!q) return null;
  const names = list.map((x) => ({ ...x, _n: normalizePlace(x.name) }));
  return (
    names.find((x) => x._n === q) ||
    names.find((x) => x._n.startsWith(q) && q.length >= 3) ||
    null
  );
};

// Prompt shown when entering a state (also used by "back")
const promptFor = (state, draft = {}, data = {}) => {
  switch (state) {
    case S.CONSENT:     return msg.consentPrompt();
    case S.CATEGORY:    return msg.categoryPrompt(data.categories || []);
    case S.DISTRICT:    return msg.districtPrompt(data.districts || []);
    case S.SUBDISTRICT: return msg.subdistrictPrompt(draft.district_name || '', data.subdistricts || []);
    case S.ADDRESS:     return msg.addressPrompt();
    case S.TITLE:       return msg.titlePrompt();
    case S.DETAIL:      return msg.detailPrompt();
    case S.TARGET:      return msg.targetPrompt();
    case S.REQUEST:     return msg.requestPrompt();
    case S.ANONYMITY:   return msg.anonymityPrompt();
    case S.NAME:        return msg.namePrompt();
    case S.PHONE:       return msg.phonePrompt();
    case S.ATTACHMENT:  return msg.attachmentPrompt((draft.attachments || []).length);
    case S.CONFIRM:     return msg.summary(draft);
    default:            return msg.mainMenu();
  }
};

// next/previous state, skipping NAME for anonymous complaints
const step = (state, draft, dir) => {
  const idx = ORDER.indexOf(state);
  if (idx === -1) return S.IDLE;
  let next = ORDER[idx + dir];
  if (next === S.NAME && draft.is_anonymous) next = ORDER[ORDER.indexOf(S.NAME) + dir];
  return next || S.IDLE;
};

const goNext = (draft, state, data, context) => {
  const next = step(state, draft, 1);
  return result(next, draft, context, promptFor(next, draft, data));
};

const goBack = (draft, state, data, context) => {
  const prev = step(state, draft, -1);
  if (prev === S.IDLE || prev === S.CONSENT) {
    // ย้อนจากขั้นแรกสุด = ออกจากการกรอก (ไม่เก็บร่างไว้)
    return result(S.IDLE, emptyDraft(), {}, msg.cancelled(), { type: 'cancel' });
  }
  return result(prev, draft, context, promptFor(prev, draft, data));
};

// Store a free-text answer, then advance
const takeText = (draft, state, data, context, field, value, label, max) => {
  const v = String(value || '').trim();
  if (!v) return result(state, draft, context, msg.emptyInput());
  if (v.length > max) return result(state, draft, context, msg.tooLong(label, max));
  return goNext({ ...draft, [field]: v }, state, data, context);
};

// ── main entry ────────────────────────────────────────────────────────────────
// session: { state, draft, context }
// input:   { kind: 'text'|'postback'|'media'|'location', text, postback:{action,params}, media, location }
// data:    { categories, districts, subdistricts }  (master data for the current step)
const advance = (session = {}, input = {}, data = {}) => {
  const state = session.state || S.IDLE;
  const draft = session.draft ? { ...session.draft } : emptyDraft();
  const context = session.context ? { ...session.context } : {};

  const action = input.kind === 'postback'
    ? (input.postback?.action || '')
    : (input.kind === 'text' ? commandFromText(input.text) : null);
  const params = input.postback?.params || {};

  // ── global commands (available in every state) ──────────────────────────────
  switch (action) {
    case 'cancel':
      return result(S.IDLE, emptyDraft(), {}, msg.cancelled(), { type: 'cancel' });
    case 'menu':
      return result(S.IDLE, emptyDraft(), {}, msg.mainMenu(), { type: 'cancel' });
    case 'guide':
      return result(state, draft, context, msg.guide());
    case 'contact':
      return result(state, draft, context, msg.contact());
    case 'start':
      return result(S.CONSENT, emptyDraft(), {}, msg.consentPrompt());
    case 'restart':
      // keep consent (already accepted) but drop everything the user typed
      return result(S.CATEGORY, emptyDraft(), {}, msg.categoryPrompt(data.categories || []));
    case 'track':
      return result(S.IDLE, draft, context, [], { type: 'track_list' });
    case 'track_view':
      return result(S.IDLE, draft, context, [], { type: 'track_view', complaintId: Number(params.id) });
    case 'more_info':
      return result(S.IDLE, draft, context, [], { type: 'info_list' });
    case 'info_reply':
      return result(S.IDLE, draft, context, [], { type: 'info_select', infoRequestId: Number(params.id) });
    case 'back':
      if (state === S.IDLE || state === S.INFO_REPLY) return result(S.IDLE, draft, context, msg.mainMenu());
      return goBack(draft, state, data, context);
    default:
      break;
  }

  // ── per-state handling ──────────────────────────────────────────────────────
  switch (state) {
    case S.CONSENT: {
      if (action !== 'consent') return result(state, draft, context, msg.consentPrompt());
      if (params.v !== 'accept') return result(S.IDLE, emptyDraft(), {}, msg.consentDeclined(), { type: 'cancel' });
      return result(S.CATEGORY, { ...draft, consent: true }, context,
        msg.categoryPrompt(data.categories || []), { type: 'consent_accepted' });
    }

    case S.CATEGORY: {
      const categories = data.categories || [];
      let picked = null;
      if (action === 'category') picked = categories.find((c) => String(c.id) === String(params.id)) || null;
      else if (input.kind === 'text') picked = matchPlace(categories, input.text) || categories.find((c) => c.name === String(input.text).trim()) || null;
      if (!picked) return result(state, draft, context, msg.categoryPrompt(categories));
      return goNext({ ...draft, category_id: picked.id, category_name: picked.name }, state, data, context);
    }

    case S.DISTRICT: {
      const districts = data.districts || [];
      // ตำแหน่งที่ผู้ใช้แชร์ → เก็บพิกัด และลองจับคู่อำเภอจากที่อยู่ที่ LINE ส่งมา
      if (input.kind === 'location') {
        const withGeo = {
          ...draft,
          latitude: input.location?.latitude ?? null,
          longitude: input.location?.longitude ?? null,
          incident_address: String(input.location?.address || '').slice(0, LIMITS.address) || draft.incident_address,
        };
        const addr = String(input.location?.address || '');
        const hit = districts.find((d) => addr.includes(d.name));
        if (!hit) return result(state, withGeo, context, msg.districtNotFound());
        return goNext({ ...withGeo, district_id: hit.id, district_name: hit.name }, state, data, context);
      }
      if (input.kind !== 'text') return result(state, draft, context, msg.districtPrompt(districts));
      const hit = matchPlace(districts, input.text);
      if (!hit) return result(state, draft, context, msg.districtNotFound());
      return goNext({ ...draft, district_id: hit.id, district_name: hit.name }, state, data, context);
    }

    case S.SUBDISTRICT: {
      if (action === 'skip') return goNext(draft, state, data, context);
      if (input.kind !== 'text') return result(state, draft, context, msg.subdistrictPrompt(draft.district_name, data.subdistricts || []));
      const hit = matchPlace(data.subdistricts || [], input.text);
      if (!hit) return result(state, draft, context, msg.subdistrictNotFound());
      return goNext({ ...draft, subdistrict_id: hit.id, subdistrict_name: hit.name }, state, data, context);
    }

    case S.ADDRESS:
      if (action === 'skip') return goNext(draft, state, data, context);
      if (input.kind !== 'text') return result(state, draft, context, msg.addressPrompt());
      return takeText(draft, state, data, context, 'incident_address', input.text, 'สถานที่เกิดเหตุ', LIMITS.address);

    case S.TITLE:
      if (input.kind !== 'text') return result(state, draft, context, msg.titlePrompt());
      return takeText(draft, state, data, context, 'title', input.text, 'หัวข้อเรื่อง', LIMITS.title);

    case S.DETAIL:
      if (input.kind !== 'text') return result(state, draft, context, msg.detailPrompt());
      return takeText(draft, state, data, context, 'description', input.text, 'รายละเอียดเหตุการณ์', LIMITS.description);

    case S.TARGET:
      if (action === 'skip') return goNext(draft, state, data, context);
      if (input.kind !== 'text') return result(state, draft, context, msg.targetPrompt());
      return takeText(draft, state, data, context, 'target_note', input.text, 'ผู้เกี่ยวข้อง', LIMITS.note);

    case S.REQUEST:
      if (action === 'skip') return goNext(draft, state, data, context);
      if (input.kind !== 'text') return result(state, draft, context, msg.requestPrompt());
      return takeText(draft, state, data, context, 'request_note', input.text, 'สิ่งที่ต้องการ', LIMITS.note);

    case S.ANONYMITY: {
      if (action !== 'anon') return result(state, draft, context, msg.anonymityPrompt());
      const isAnon = params.v === '1';
      return goNext({ ...draft, is_anonymous: isAnon }, state, data, context);
    }

    case S.NAME:
      if (input.kind !== 'text') return result(state, draft, context, msg.namePrompt());
      return takeText(draft, state, data, context, 'complainant_name', input.text, 'ชื่อ-นามสกุล', LIMITS.name);

    case S.PHONE: {
      if (input.kind !== 'text') return result(state, draft, context, msg.phonePrompt());
      const phone = String(input.text || '').replace(/[\s-]/g, '');
      if (!PHONE_RE.test(phone)) return result(state, draft, context, msg.phoneInvalid());
      return goNext({ ...draft, complainant_phone: phone }, state, data, context);
    }

    case S.ATTACHMENT: {
      if (action === 'attach_done' || action === 'skip') return goNext(draft, state, data, context);
      if (input.kind === 'media') {
        // ดาวน์โหลด+บันทึกไฟล์เป็นงานของ service (ต้องเรียก LINE content API)
        return result(state, draft, context, [], { type: 'attach_media', media: input.media });
      }
      return result(state, draft, context, msg.attachmentPrompt((draft.attachments || []).length));
    }

    case S.CONFIRM:
      if (action === 'confirm') return result(state, draft, context, [], { type: 'submit' });
      return result(state, draft, context, msg.summary(draft));

    case S.INFO_REPLY: {
      if (action === 'info_done') return result(state, draft, context, [], { type: 'info_done' });
      if (input.kind === 'media') return result(state, draft, context, [], { type: 'info_media', media: input.media });
      if (input.kind === 'text') {
        const t = String(input.text || '').trim();
        if (!t) return result(state, draft, context, msg.emptyInput());
        return result(state, draft, context, [], { type: 'info_text', text: t.slice(0, LIMITS.note) });
      }
      return result(state, draft, context, msg.infoReplyReceived((context.responseCount || 0)));
    }

    default:
      // IDLE — ไม่มีบทสนทนาค้างอยู่
      return result(S.IDLE, emptyDraft(), {}, msg.unknownInput());
  }
};

module.exports = { S, ORDER, LIMITS, PHONE_RE, advance, promptFor, commandFromText, matchPlace, emptyDraft };
