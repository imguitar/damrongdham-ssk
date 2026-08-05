'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/database');
const { UPLOAD_DIR } = require('../config/upload');
const complaintModel = require('../models/complaintModel');
const attachmentModel = require('../models/attachmentModel');
const messaging = require('./lineMessagingService');
const staffNotifier = require('./staffLineNotifier');
const { writeAuditLog } = require('../middleware/auditLog');

// สร้างเรื่องร้องเรียนจากบทสนทนา LINE ลง "ระบบเดิม" ทั้งหมด
// (ใช้ complaintModel.create → เลขที่เรื่องจาก complaint_sequences เดิม)

const LINE_CHANNEL_NAME = 'LINE Official Account';
const DEFAULT_SERVICE_TYPE = 'ทั่วไป';
const DEFAULT_NATURE = 'เรื่องร้องเรียนร้องทุกข์';
const DEFAULT_COMPLAINANT_TYPE = 'บุคคลธรรมดา';
const PROVINCE_NAME = 'ศรีสะเกษ';

// ชนิดไฟล์ที่รับ — ต้องสอดคล้องกับ config/upload.js (ระบบเดิม)
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

let cachedRefs = null;

// master data ids ที่ใช้ประจำ — อ่านครั้งเดียวแล้ว cache (ค่าคงที่ของระบบ)
const masterRefs = async () => {
  if (cachedRefs) return cachedRefs;

  const pick = async (table, name) => {
    const [rows] = await pool.query(
      `SELECT id FROM ${table} WHERE name = ? AND is_active = 1 LIMIT 1`, [name]
    );
    if (rows[0]) return rows[0].id;
    const [[fallback]] = await pool.query(`SELECT id FROM ${table} WHERE is_active = 1 ORDER BY id LIMIT 1`);
    return fallback ? fallback.id : null;
  };

  cachedRefs = {
    channelId: await pick('complaint_channels', LINE_CHANNEL_NAME),
    serviceTypeId: await pick('service_types', DEFAULT_SERVICE_TYPE),
    natureId: await pick('complaint_natures', DEFAULT_NATURE),
    complainantTypeId: await pick('complainant_types', DEFAULT_COMPLAINANT_TYPE),
    provinceId: await pick('provinces', PROVINCE_NAME),
  };
  return cachedRefs;
};

const listCategories = async () => {
  const [rows] = await pool.query('SELECT id, name FROM complaint_categories WHERE is_active = 1 ORDER BY id');
  return rows;
};

const listDistricts = async () => {
  const refs = await masterRefs();
  const [rows] = await pool.query(
    'SELECT id, name FROM districts WHERE province_id = ? AND is_active = 1 ORDER BY id',
    [refs.provinceId]
  );
  return rows;
};

const listSubdistricts = async (districtId) => {
  if (!districtId) return [];
  const [rows] = await pool.query(
    'SELECT id, name FROM subdistricts WHERE district_id = ? AND is_active = 1 ORDER BY id',
    [districtId]
  );
  return rows;
};

// รวมข้อมูลเสริมเข้ากับ description (ระบบเดิมไม่มีคอลัมน์แยกสำหรับ 2 ส่วนนี้)
const composeDescription = (draft) => {
  const parts = [String(draft.description || '').trim()];
  if (draft.target_note) parts.push(`หน่วยงาน/ผู้เกี่ยวข้องที่ผู้ร้องระบุ: ${draft.target_note}`);
  if (draft.request_note) parts.push(`สิ่งที่ผู้ร้องต้องการให้ช่วยเหลือ: ${draft.request_note}`);
  parts.push('(รับเรื่องผ่าน LINE Official Account)');
  return parts.filter(Boolean).join('\n\n');
};

// ── ไฟล์แนบจาก LINE ──────────────────────────────────────────────────────────
// ดาวน์โหลดผ่าน channel token → ตรวจชนิด/ขนาด → เปลี่ยนชื่อไฟล์ก่อนเก็บ
// ชื่อไฟล์ถูกสร้างขึ้นเองทั้งหมด (กัน path traversal) และเก็บใน private storage
// เดียวกับระบบเดิม — ไม่มี public URL
const downloadAndStore = async ({ messageId, fileName, fileSize }) => {
  if (fileSize && Number(fileSize) > MAX_FILE_BYTES) {
    return { ok: false, reason: 'ไฟล์ใหญ่เกิน 10 MB' };
  }

  const res = await messaging.getMessageContent(messageId);
  if (!res.ok) {
    return { ok: false, reason: res.errorCode === 'FILE_TOO_LARGE' ? 'ไฟล์ใหญ่เกิน 10 MB' : 'ดาวน์โหลดไฟล์ไม่สำเร็จ' };
  }

  const ext = MIME_EXT[res.contentType];
  if (!ext) return { ok: false, reason: 'ประเภทไฟล์ไม่รองรับ' };
  if (res.buffer.length > MAX_FILE_BYTES) return { ok: false, reason: 'ไฟล์ใหญ่เกิน 10 MB' };

  const storedName = `line-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, storedName), res.buffer);

  // ชื่อที่แสดงให้เจ้าหน้าที่เห็น — ตัดพาธ/อักขระอันตรายออกเสมอ
  const displayName = path.basename(String(fileName || `line-upload${ext}`)).replace(/[/\\:*?"<>|]/g, '_').slice(0, 200);

  return {
    ok: true,
    file: { storedName, fileName: displayName, size: res.buffer.length, mime: res.contentType },
  };
};

// ลบไฟล์ร่างที่ยังไม่ได้ผูกกับเรื่อง (ยกเลิก/หมดอายุ)
const discardDraftFiles = async (attachments = []) => {
  for (const a of attachments) {
    if (!a?.storedName) continue;
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(a.storedName))).catch(() => {});
  }
};

// ── สร้างเรื่อง ──────────────────────────────────────────────────────────────
// บันทึกลงระบบเดิมก่อน แล้วจึงคืนเลขที่เรื่อง — ถ้า throw ผู้เรียกต้องไม่แจ้งว่ารับเรื่องสำเร็จ
const createComplaintFromDraft = async ({ citizenId, draft, lineUserId }) => {
  const refs = await masterRefs();

  const complaintId = await complaintModel.create({
    title: String(draft.title || '').trim().slice(0, 500),
    description: composeDescription(draft),
    serviceTypeId: refs.serviceTypeId,
    complaintNatureId: refs.natureId,
    complainantTypeId: refs.complainantTypeId,
    channelId: refs.channelId,
    categoryId: draft.category_id || null,
    complainantName: draft.is_anonymous ? null : draft.complainant_name || null,
    complainantIdCard: null, // ไม่ขอเลขบัตรประชาชนผ่าน LINE (§ความปลอดภัย)
    complainantPhone: draft.complainant_phone,
    complainantAddress: null,
    complainantEmail: null,
    citizenId,
    isAnonymous: Boolean(draft.is_anonymous),
    provinceId: refs.provinceId,
    districtId: draft.district_id || null,
    subdistrictId: draft.subdistrict_id || null,
    postalCode: null,
    incidentAddress: draft.incident_address || null,
    latitude: draft.latitude || null,
    longitude: draft.longitude || null,
    priority: 'MEDIUM',
    source: 'PUBLIC',
    receivedBy: null,
  });

  // ผูกไฟล์ที่ผู้ร้องส่งไว้ระหว่างสนทนาเข้ากับเรื่อง
  for (const a of (draft.attachments || []).slice(0, MAX_ATTACHMENTS)) {
    try {
      await attachmentModel.create({
        complaintId,
        updateId: null,
        fileName: a.fileName,
        filePath: a.storedName,
        fileSize: a.size,
        fileType: a.mime,
        uploadedBy: null,
        uploadedByCitizen: citizenId,
        uploadSource: 'LINE',
      });
    } catch (err) {
      console.error('[LineIntake] attach failed:', err.message);
    }
  }

  const complaint = await complaintModel.findById(complaintId);

  writeAuditLog({
    userId: null,
    action: 'LINE_COMPLAINT_CREATED',
    resource: 'complaints',
    resourceId: complaintId,
    details: {
      complaint_number: complaint?.complaint_number,
      citizen_id: citizenId,
      channel: 'line',
      attachments: (draft.attachments || []).length,
      // ไม่บันทึกเนื้อหาเรื่อง/ข้อมูลส่วนบุคคล และไม่บันทึก LINE userId เต็ม
      line_user_ref: lineUserId ? `${String(lineUserId).slice(0, 6)}…` : null,
    },
  });

  // แจ้งเจ้าหน้าที่ศูนย์ผ่านช่องทางเดิม (กลุ่ม LINE / DM) — fire and forget
  staffNotifier.notifyNewComplaint(complaintId);

  return complaint;
};

module.exports = {
  LINE_CHANNEL_NAME, MAX_ATTACHMENTS, MAX_FILE_BYTES, MIME_EXT,
  masterRefs, listCategories, listDistricts, listSubdistricts,
  composeDescription, downloadAndStore, discardDraftFiles, createComplaintFromDraft,
};
