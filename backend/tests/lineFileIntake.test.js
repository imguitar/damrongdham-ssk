import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import intake from '../src/services/lineIntakeService.js';
import { UPLOAD_DIR } from '../src/config/upload.js';

// ตรวจการรับไฟล์ที่ประชาชนส่งผ่าน LINE — ชนิด/ขนาด/ชื่อไฟล์ที่จัดเก็บ
// stub global.fetch (โมดูล source เป็น CJS จึง mock ตัว service ตรง ๆ ไม่ได้ — ดู docs/LINE_TESTING.md)

const realFetch = global.fetch;
const created = [];

const stubContent = ({ contentType, size = 1024, status = 200 }) => {
  global.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h) => (h === 'content-type' ? contentType : h === 'content-length' ? String(size) : null) },
    arrayBuffer: async () => new ArrayBuffer(size),
    text: async () => '',
    json: async () => ({}),
  });
};

beforeEach(() => { created.length = 0; });

afterEach(() => {
  global.fetch = realFetch;
  for (const f of created) fs.existsSync(f) && fs.unlinkSync(f);
});

describe('รับไฟล์แนบจาก LINE', () => {
  it('รับไฟล์รูปภาพและเปลี่ยนชื่อไฟล์ก่อนจัดเก็บ (กัน path traversal)', async () => {
    stubContent({ contentType: 'image/jpeg' });
    const res = await intake.downloadAndStore({ messageId: 'm1', fileName: '../../etc/passwd.jpg' });

    expect(res.ok).toBe(true);
    expect(res.file.storedName).toMatch(/^line-\d+-[0-9a-f]{16}\.jpg$/);
    expect(res.file.fileName).not.toContain('/');
    expect(res.file.mime).toBe('image/jpeg');

    const full = path.join(UPLOAD_DIR, res.file.storedName);
    created.push(full);
    expect(fs.existsSync(full)).toBe(true);
  });

  it('ปฏิเสธชนิดไฟล์ที่ไม่รองรับ (เช่น สคริปต์/ไฟล์รันได้)', async () => {
    stubContent({ contentType: 'application/x-msdownload' });
    const res = await intake.downloadAndStore({ messageId: 'm2', fileName: 'evil.exe' });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('ประเภทไฟล์ไม่รองรับ');
  });

  it('ปฏิเสธไฟล์ที่ใหญ่เกินขีดจำกัดตั้งแต่ยังไม่ดาวน์โหลด', async () => {
    stubContent({ contentType: 'application/pdf' });
    const res = await intake.downloadAndStore({ messageId: 'm3', fileName: 'big.pdf', fileSize: intake.MAX_FILE_BYTES + 1 });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('10 MB');
  });

  it('ปฏิเสธเมื่อ LINE ตอบ error (ไม่สร้างไฟล์ค้างไว้)', async () => {
    stubContent({ contentType: 'image/png', status: 404 });
    const res = await intake.downloadAndStore({ messageId: 'm4' });
    expect(res.ok).toBe(false);
  });

  it('ลบไฟล์ร่างที่ยังไม่ผูกกับเรื่องได้ (ยกเลิก/หมดอายุ)', async () => {
    stubContent({ contentType: 'image/png' });
    const res = await intake.downloadAndStore({ messageId: 'm5', fileName: 'a.png' });
    const full = path.join(UPLOAD_DIR, res.file.storedName);
    expect(fs.existsSync(full)).toBe(true);

    global.fetch = realFetch;
    await intake.discardDraftFiles([res.file]);
    expect(fs.existsSync(full)).toBe(false);
  });
});

describe('การประกอบรายละเอียดเรื่องก่อนบันทึก', () => {
  it('รวมผู้เกี่ยวข้อง/สิ่งที่ต้องการ และระบุช่องทางว่า LINE', () => {
    const text = intake.composeDescription({
      description: 'มีน้ำเสียไหลลงคลอง',
      target_note: 'โรงงาน ก.',
      request_note: 'ขอให้ตรวจสอบ',
    });
    expect(text).toContain('มีน้ำเสียไหลลงคลอง');
    expect(text).toContain('โรงงาน ก.');
    expect(text).toContain('ขอให้ตรวจสอบ');
    expect(text).toContain('LINE');
  });
});
