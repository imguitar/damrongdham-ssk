import { describe, it, expect } from 'vitest';
import msg from '../src/utils/lineBotMessages.js';
import tpl from '../src/utils/lineMessageTemplate.js';

// ข้อความที่ส่งถึงประชาชนต้องไม่มีข้อมูลภายใน/ข้อมูลอ่อนไหว (§18)

const collectText = (m) => [].concat(m).map((x) => x.text || '').join('\n');

describe('ข้อความในแชต LINE', () => {
  it('ทุก quick reply ไม่เกินขีดจำกัดของ LINE (13 ปุ่ม)', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `ประเภท ${i + 1}` }));
    const m = msg.categoryPrompt(many);
    expect(m.quickReply.items.length).toBeLessThanOrEqual(msg.MAX_QUICK_REPLIES);
  });

  it('ประกาศความเป็นส่วนตัวมีทั้งฉบับย่อ ลิงก์ฉบับเต็ม และปุ่มยอมรับ/ไม่ยอมรับ', () => {
    const m = msg.consentPrompt();
    expect(m.text).toContain('ประกาศความเป็นส่วนตัว');
    expect(m.text).toMatch(/https?:\/\//);
    const labels = m.quickReply.items.map((i) => i.action.data);
    expect(labels).toContain('a=consent&v=accept');
    expect(labels).toContain('a=consent&v=decline');
  });

  it('เตือนไม่ให้ส่งเลขบัตรประชาชนทางแชต และระบบไม่ขอเลขบัตร', () => {
    const t = msg.consentPrompt().text;
    expect(t).toContain('อย่าส่งเลขบัตรประชาชน');
  });

  it('ข้อความยืนยันรับเรื่องมีเลขที่รับเรื่อง วันที่ และสถานะ', () => {
    const t = collectText(msg.submitted({ complaintNumber: 'DC-202608-0007', receivedDate: '5 สิงหาคม 2569' }));
    expect(t).toContain('DC-202608-0007');
    expect(t).toContain('5 สิงหาคม 2569');
    expect(t).toContain('รับเรื่องแล้ว');
  });

  it('สรุปเรื่องปกปิดตัวตนไม่แสดงชื่อผู้ร้อง', () => {
    const t = msg.summary({
      is_anonymous: true, complainant_name: 'สมชาย ใจดี', complainant_phone: '0812345678', title: 'x',
    }).text;
    expect(t).toContain('[ปกปิดตัวตน]');
    expect(t).not.toContain('สมชาย ใจดี');
  });

  it('เมื่อบันทึกไม่สำเร็จ ต้องไม่บอกว่ารับเรื่องแล้ว และไม่มีเลขที่เรื่อง', () => {
    const t = collectText(msg.submitFailed());
    expect(t).toContain('ยังไม่ถือว่ารับเรื่อง');
    expect(t).not.toMatch(/DC-\d{6}-\d{4}/);
  });

  it('ผลการติดตามสถานะแสดงเฉพาะข้อมูลที่เปิดเผยได้', () => {
    const t = collectText(msg.statusDetail({
      complaint: {
        complaint_number: 'DC-202608-0001', title: 'ถนนชำรุด', status: 'IN_PROGRESS',
        updated_at_th: '1 ส.ค. 2569 10:00', due_date_th: '15 ส.ค. 2569',
      },
      agencyName: 'แขวงทางหลวงศรีสะเกษ',
      publicUpdate: 'อยู่ระหว่างสำรวจพื้นที่',
    }));
    expect(t).toContain('DC-202608-0001');
    expect(t).toContain('อยู่ระหว่างดำเนินการ');
    expect(t).toContain('แขวงทางหลวงศรีสะเกษ');
    expect(t).toContain('อยู่ระหว่างสำรวจพื้นที่');
  });

  it('ไม่บอกว่า "ไม่มีสิทธิ์" เมื่อค้นเรื่องที่ไม่ใช่ของตน (กันการเดาเลขที่เรื่อง)', () => {
    const t = collectText(msg.noComplaints());
    expect(t).not.toMatch(/ไม่มีสิทธิ์|forbidden/i);
  });
});

describe('template ข้อความ push (outbox)', () => {
  it('ข้อความขอข้อมูลเพิ่มเติมมีเลขที่เรื่อง รายการที่ขอ และกำหนดส่ง', () => {
    const t = tpl.buildByEvent('COMPLAINT_MORE_INFO_REQUIRED', {
      complaintNumber: 'DC-202608-0002',
      requestDetail: 'สำเนาโฉนดที่ดิน และภาพถ่ายบริเวณที่เกิดเหตุ',
      dueDate: '20 สิงหาคม 2569',
    });
    expect(t).toContain('DC-202608-0002');
    expect(t).toContain('สำเนาโฉนดที่ดิน');
    expect(t).toContain('20 สิงหาคม 2569');
  });

  it('ข้อความแจ้งสถานะมีแค่เลขที่เรื่อง + สถานะ + ลิงก์ (ไม่มีรายละเอียดเรื่อง)', () => {
    const t = tpl.buildByEvent('COMPLAINT_STATUS_CHANGED', {
      complaintNumber: 'DC-202608-0003', status: 'CLOSED',
    });
    expect(t).toContain('DC-202608-0003');
    expect(t).toContain(tpl.statusLabel('CLOSED'));
    expect(t.length).toBeLessThan(400);
  });

  it('ข้อความที่เจ้าหน้าที่กำหนดเองถูกห่อด้วยเลขที่เรื่องและลิงก์ที่ต้องยืนยันตัวตน', () => {
    const t = tpl.buildByEvent('COMPLAINT_CUSTOM_MESSAGE', {
      complaintNumber: 'DC-202608-0004',
      customMessage: 'เจ้าหน้าที่จะลงพื้นที่ในวันที่ 10 สิงหาคม 2569',
    });
    expect(t).toContain('DC-202608-0004');
    expect(t).toContain('เจ้าหน้าที่จะลงพื้นที่');
    expect(t).toContain('/citizen/complaints/DC-202608-0004');
  });
});
