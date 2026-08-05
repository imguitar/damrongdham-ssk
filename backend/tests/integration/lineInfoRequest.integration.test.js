import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ctrl from '../../src/controllers/lineComplaintController.js';
import infoRequestModel from '../../src/models/infoRequestModel.js';
import {
  pool, dbAvailable, createCitizen, cleanupCitizen, createComplaint, cleanupComplaint,
  createStaffUser, cleanupUser, getOutbox,
} from './_helpers.js';

// เจ้าหน้าที่ขอข้อมูลเพิ่มเติม → ประชาชนตอบกลับทาง LINE → เจ้าหน้าที่เห็นข้อมูล
const DB = await dbAvailable();

const mkRes = () => {
  const s = { statusCode: 200, body: null };
  return { status(c) { s.statusCode = c; return this; }, json(b) { s.body = b; return this; }, _s: s };
};
const next = () => (err) => { if (err) throw err; };
const officer = (id) => ({ id, role: 'officer', agency_id: null });
const mkReq = (over = {}) => ({ ip: '127.0.0.1', get: () => 'itest', headers: {}, body: {}, params: {}, ...over });

let citizenId; let userId; let complaint;

beforeAll(async () => {
  if (!DB) return;
  citizenId = await createCitizen({ lineSub: 'Uitest_inforeq_0001' });
  userId = await createStaffUser({ roleId: 3 });
  complaint = await createComplaint({ citizenId, status: 'IN_PROGRESS' });
});

afterAll(async () => {
  if (!DB) return;
  if (complaint) {
    await pool.query('DELETE FROM complaint_info_responses WHERE complaint_id = ?', [complaint.id]);
    await pool.query('DELETE FROM complaint_attachments WHERE complaint_id = ?', [complaint.id]);
    await pool.query('DELETE FROM complaint_info_requests WHERE complaint_id = ?', [complaint.id]);
    await cleanupComplaint(complaint.id);
  }
  if (userId) await cleanupUser(userId);
  if (citizenId) await cleanupCitizen(citizenId);
});

(DB ? describe : describe.skip)('ขอข้อมูลเพิ่มเติมจากประชาชน', () => {
  let infoRequestId;

  it('สร้างคำขอและส่งข้อความเข้าคิวแจ้งเตือน LINE', async () => {
    const res = mkRes();
    await ctrl.createInfoRequest(
      mkReq({
        user: officer(userId),
        params: { id: String(complaint.id) },
        body: { message: 'ขอสำเนาโฉนดที่ดินและภาพถ่ายจุดเกิดเหตุ', due_date: '2026-12-31' },
      }),
      res, next()
    );

    expect(res._s.statusCode).toBe(201);
    expect(res._s.body.data.delivery).toBe('queued');
    infoRequestId = res._s.body.data.info_request.id;

    const outbox = (await getOutbox(complaint.id)).filter((o) => o.event_type === 'COMPLAINT_MORE_INFO_REQUIRED');
    expect(outbox.length).toBe(1);
    const payload = typeof outbox[0].payload === 'string' ? JSON.parse(outbox[0].payload) : outbox[0].payload;
    expect(payload.requestDetail).toContain('สำเนาโฉนด');
    expect(payload.dueDate).toBeTruthy();
  });

  it('ปฏิเสธคำขอที่ไม่ได้ระบุรายการที่ต้องการ', async () => {
    const res = mkRes();
    await ctrl.createInfoRequest(
      mkReq({ user: officer(userId), params: { id: String(complaint.id) }, body: { message: '   ' } }),
      res, next()
    );
    expect(res._s.statusCode).toBe(400);
  });

  it('ส่งซ้ำได้และไม่ทับ idempotency key เดิม (นับจำนวนครั้งที่ส่ง)', async () => {
    const res = mkRes();
    await ctrl.resendInfoRequest(
      mkReq({ user: officer(userId), params: { id: String(complaint.id), reqId: String(infoRequestId) } }),
      res, next()
    );
    expect(res._s.statusCode).toBe(200);

    const outbox = (await getOutbox(complaint.id)).filter((o) => o.event_type === 'COMPLAINT_MORE_INFO_REQUIRED');
    expect(outbox.length).toBe(2);

    const reloaded = await infoRequestModel.findById(infoRequestId);
    expect(reloaded.notify_count).toBe(2);
  });

  it('บันทึก audit log ทุกครั้งที่สร้าง/ส่งซ้ำ', async () => {
    const [rows] = await pool.query(
      `SELECT action FROM audit_logs WHERE resource = 'complaint_info_requests' AND resource_id = ?`,
      [infoRequestId]
    );
    const actions = rows.map((r) => r.action);
    expect(actions).toContain('INFO_REQUEST_CREATED');
    expect(actions).toContain('INFO_REQUEST_RESENT');
  });

  it('ประชาชนส่งข้อมูลกลับ → บันทึกผูกกับคำขอและเรื่องเดิม', async () => {
    await infoRequestModel.addResponse({
      infoRequestId, complaintId: complaint.id, citizenId, message: 'ส่งเอกสารแล้วครับ',
    });
    const [att] = await pool.query(
      `INSERT INTO complaint_attachments (complaint_id, info_request_id, file_name, file_path, file_size, file_type,
         uploaded_by_citizen, upload_source) VALUES (?, ?, 'itest.pdf', 'line-itest.pdf', 1000, 'application/pdf', ?, 'LINE')`,
      [complaint.id, infoRequestId, citizenId]
    );
    await infoRequestModel.addResponse({
      infoRequestId, complaintId: complaint.id, citizenId, attachmentId: att.insertId,
    });

    expect(await infoRequestModel.countResponses(infoRequestId)).toBe(2);

    const responses = await infoRequestModel.findResponsesByComplaint(complaint.id);
    expect(responses.some((r) => r.file_name === 'itest.pdf')).toBe(true);
  });

  it('ปิดคำขอเมื่อประชาชนกดส่งเสร็จสิ้น (ทำซ้ำไม่เปลี่ยนสถานะอีก)', async () => {
    expect(await infoRequestModel.markResponded(infoRequestId)).toBe(true);
    expect(await infoRequestModel.markResponded(infoRequestId)).toBe(false);

    const reloaded = await infoRequestModel.findById(infoRequestId);
    expect(reloaded.status).toBe('RESPONDED');
    expect(await infoRequestModel.findPendingByCitizen(citizenId)).toHaveLength(0);
  });

  it('ยกเลิกคำขอที่ยังรอข้อมูลได้ และยกเลิกซ้ำไม่ได้', async () => {
    const created = await infoRequestModel.create({
      complaintId: complaint.id, requestedBy: userId, message: 'ITEST ขอเอกสารเพิ่ม',
    });

    const res = mkRes();
    await ctrl.cancelInfoRequest(
      mkReq({ user: officer(userId), params: { id: String(complaint.id), reqId: String(created) } }),
      res, next()
    );
    expect(res._s.statusCode).toBe(200);

    const res2 = mkRes();
    await ctrl.cancelInfoRequest(
      mkReq({ user: officer(userId), params: { id: String(complaint.id), reqId: String(created) } }),
      res2, next()
    );
    expect(res2._s.statusCode).toBe(400);
  });

  it('แผง LINE ของเรื่องแสดงคำขอ ข้อมูลที่ส่งกลับ และเอกสารของประชาชน', async () => {
    const res = mkRes();
    await ctrl.getOverview(mkReq({ user: officer(userId), params: { id: String(complaint.id) } }), res, next());

    const data = res._s.body.data;
    expect(data.citizen.linked).toBe(true);
    expect(data.info_requests.length).toBeGreaterThanOrEqual(1);
    expect(data.documents.some((d) => d.file_name === 'itest.pdf')).toBe(true);
    expect(data.notification_pending.length).toBeGreaterThanOrEqual(1);
  });
});
