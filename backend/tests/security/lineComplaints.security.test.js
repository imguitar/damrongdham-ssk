import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ctrl from '../../src/controllers/lineComplaintController.js';
import infoRequestModel from '../../src/models/infoRequestModel.js';
import {
  pool, dbAvailable, createCitizen, cleanupCitizen, createComplaint, cleanupComplaint,
  createStaffUser, cleanupUser,
} from '../integration/_helpers.js';

// ความปลอดภัยของช่องทาง LINE: สิทธิ์เข้าถึงเรื่อง, IDOR ของคำขอข้อมูล, การปกปิดตัวตน
const DB = await dbAvailable();

const mkRes = () => {
  const s = { statusCode: 200, body: null };
  return { status(c) { s.statusCode = c; return this; }, json(b) { s.body = b; return this; }, _s: s };
};
const next = () => (err) => { if (err) throw err; };
const mkReq = (over = {}) => ({ ip: '127.0.0.1', get: () => 'itest', headers: {}, body: {}, params: {}, ...over });

let citizenA; let citizenB; let officerId; let agencyUserId; let complaintA; let complaintB; let agencyId;

beforeAll(async () => {
  if (!DB) return;
  citizenA = await createCitizen({ lineSub: 'Uitest_secA_0001' });
  citizenB = await createCitizen({ lineSub: 'Uitest_secB_0001' });
  officerId = await createStaffUser({ roleId: 3 });
  const [[agency]] = await pool.query('SELECT id FROM agencies WHERE is_center = 0 LIMIT 1');
  agencyId = agency.id;
  agencyUserId = await createStaffUser({ roleId: 5, agencyId });
  complaintA = await createComplaint({ citizenId: citizenA, status: 'IN_PROGRESS' });
  complaintB = await createComplaint({ citizenId: citizenB, status: 'IN_PROGRESS' });
});

afterAll(async () => {
  if (!DB) return;
  for (const c of [complaintA, complaintB].filter(Boolean)) {
    await pool.query('DELETE FROM complaint_info_responses WHERE complaint_id = ?', [c.id]);
    await pool.query('DELETE FROM complaint_info_requests WHERE complaint_id = ?', [c.id]);
    await cleanupComplaint(c.id);
  }
  for (const u of [officerId, agencyUserId].filter(Boolean)) await cleanupUser(u);
  for (const c of [citizenA, citizenB].filter(Boolean)) await cleanupCitizen(c);
});

(DB ? describe : describe.skip)('สิทธิ์เข้าถึงเรื่องของเจ้าหน้าที่หน่วยงาน', () => {
  it('หน่วยงานที่ไม่ได้รับมอบหมายเรื่องนี้ ขอข้อมูลเพิ่มเติมไม่ได้ (403)', async () => {
    const res = mkRes();
    await ctrl.createInfoRequest(
      mkReq({
        user: { id: agencyUserId, role: 'agency_officer', agency_id: agencyId },
        params: { id: String(complaintA.id) },
        body: { message: 'ขอเอกสาร' },
      }),
      res, next()
    );
    expect(res._s.statusCode).toBe(403);
  });

  it('หน่วยงานที่ไม่ได้รับมอบหมายเรื่องนี้ ส่งข้อความที่กำหนดเองไม่ได้ (403)', async () => {
    const res = mkRes();
    await ctrl.sendCustomMessage(
      mkReq({
        user: { id: agencyUserId, role: 'agency_officer', agency_id: agencyId },
        params: { id: String(complaintA.id) },
        body: { message: 'ข้อความทดสอบ' },
      }),
      res, next()
    );
    expect(res._s.statusCode).toBe(403);
  });

  it('หน่วยงานที่ไม่ได้รับมอบหมาย ดูแผง LINE ของเรื่องไม่ได้ (403)', async () => {
    const res = mkRes();
    await ctrl.getOverview(
      mkReq({ user: { id: agencyUserId, role: 'agency_officer', agency_id: agencyId }, params: { id: String(complaintA.id) } }),
      res, next()
    );
    expect(res._s.statusCode).toBe(403);
  });

  it('เมื่อได้รับมอบหมายเรื่องแล้ว จึงเข้าถึงได้', async () => {
    await pool.query(
      `INSERT INTO complaint_assignments (complaint_id, agency_id, assigned_by, due_date, status, is_active)
       VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'ACCEPTED', 1)`,
      [complaintA.id, agencyId, officerId]
    );
    const res = mkRes();
    await ctrl.getOverview(
      mkReq({ user: { id: agencyUserId, role: 'agency_officer', agency_id: agencyId }, params: { id: String(complaintA.id) } }),
      res, next()
    );
    expect(res._s.statusCode).toBe(200);
  });

  it('อ้าง id คำขอข้ามเรื่อง → 404 (กันเดา id)', async () => {
    const otherRequestId = await infoRequestModel.create({
      complaintId: complaintB.id, requestedBy: officerId, message: 'ITEST เรื่องอื่น',
    });
    const res = mkRes();
    await ctrl.resendInfoRequest(
      mkReq({
        user: { id: officerId, role: 'officer', agency_id: null },
        params: { id: String(complaintA.id), reqId: String(otherRequestId) },
      }),
      res, next()
    );
    expect(res._s.statusCode).toBe(404);
  });
});

(DB ? describe : describe.skip)('IDOR: ประชาชนเข้าถึงได้เฉพาะคำขอของเรื่องตนเอง', () => {
  it('คำขอของผู้ร้องรายอื่นไม่ถูกส่งคืนให้ (แม้รู้ id)', async () => {
    const reqId = await infoRequestModel.create({
      complaintId: complaintA.id, requestedBy: officerId, message: 'ITEST ขอเอกสาร',
    });
    expect(await infoRequestModel.findPendingForCitizen(reqId, citizenA)).toBeTruthy();
    expect(await infoRequestModel.findPendingForCitizen(reqId, citizenB)).toBeNull();
  });

  it('รายการคำขอที่รอตอบของแต่ละคนแยกกัน', async () => {
    const forA = await infoRequestModel.findPendingByCitizen(citizenA);
    const forB = await infoRequestModel.findPendingByCitizen(citizenB);
    expect(forA.every((r) => r.complaint_number === complaintA.number)).toBe(true);
    expect(forB.every((r) => r.complaint_number === complaintB.number)).toBe(true);
  });
});

(DB ? describe : describe.skip)('การปกปิดตัวตนและการแจ้งเตือน', () => {
  it('เรื่องปกปิดตัวตน: เจ้าหน้าที่หน่วยงานไม่เห็นชื่อบัญชี LINE ของผู้ร้อง', async () => {
    await pool.query('UPDATE complaints SET is_anonymous = 1 WHERE id = ?', [complaintA.id]);
    await pool.query('UPDATE citizen_identities SET display_name = ? WHERE citizen_id = ?', ['ITEST ชื่อเล่น', citizenA]);

    const resAgency = mkRes();
    await ctrl.getOverview(
      mkReq({ user: { id: agencyUserId, role: 'agency_officer', agency_id: agencyId }, params: { id: String(complaintA.id) } }),
      resAgency, next()
    );
    expect(resAgency._s.body.data.citizen.linked).toBe(true);
    expect(resAgency._s.body.data.citizen.display_name).toBeNull();

    const resOfficer = mkRes();
    await ctrl.getOverview(
      mkReq({ user: { id: officerId, role: 'officer', agency_id: null }, params: { id: String(complaintA.id) } }),
      resOfficer, next()
    );
    expect(resOfficer._s.body.data.citizen.display_name).toBe('ITEST ชื่อเล่น');

    await pool.query('UPDATE complaints SET is_anonymous = 0 WHERE id = ?', [complaintA.id]);
  });

  it('ส่งแจ้งผลซ้ำไม่ได้เมื่อผู้ร้องยังไม่ผูก LINE (แจ้ง error ไม่เงียบ)', async () => {
    await pool.query('DELETE FROM citizen_identities WHERE citizen_id = ?', [citizenB]);
    const res = mkRes();
    await ctrl.notifyStatus(
      mkReq({ user: { id: officerId, role: 'officer', agency_id: null }, params: { id: String(complaintB.id) } }),
      res, next()
    );
    expect(res._s.statusCode).toBe(400);
    expect(res._s.body.error.code).toBe('LINE_NOT_LINKED');
  });

  it('ส่งแจ้งผลซ้ำหลายครั้งในนาทีเดียวกันไม่สร้างข้อความซ้ำ (idempotency)', async () => {
    const send = async () => {
      const res = mkRes();
      await ctrl.notifyStatus(
        mkReq({ user: { id: officerId, role: 'officer', agency_id: null }, params: { id: String(complaintA.id) } }),
        res, next()
      );
      return res._s.statusCode;
    };
    expect(await send()).toBe(200);
    expect(await send()).toBe(200);

    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM notification_outbox
       WHERE complaint_id = ? AND idempotency_key LIKE '%:manual:%'`,
      [complaintA.id]
    );
    expect(rows[0].total).toBe(1);
  });

  it('ข้อความที่เจ้าหน้าที่กำหนดเองถูก trim และกดซ้ำในนาทีเดียวกันไม่สร้างคิวซ้ำ', async () => {
    const send = async () => {
      const res = mkRes();
      await ctrl.sendCustomMessage(
        mkReq({
          user: { id: officerId, role: 'officer', agency_id: null },
          params: { id: String(complaintA.id) },
          body: { message: '  กรุณาติดต่อกลับภายในเวลาราชการ  ' },
        }),
        res, next()
      );
      return res._s.statusCode;
    };
    expect(await send()).toBe(200);
    expect(await send()).toBe(200);

    const [rows] = await pool.query(
      `SELECT payload FROM notification_outbox
       WHERE complaint_id = ? AND event_type = 'COMPLAINT_CUSTOM_MESSAGE'`,
      [complaintA.id]
    );
    expect(rows).toHaveLength(1);
    const payload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
    expect(payload.customMessage).toBe('กรุณาติดต่อกลับภายในเวลาราชการ');
  });

  it('ไม่รับข้อความที่ว่างหรือยาวเกิน 1,000 ตัวอักษร', async () => {
    for (const message of ['   ', 'ก'.repeat(1001)]) {
      const res = mkRes();
      await ctrl.sendCustomMessage(
        mkReq({
          user: { id: officerId, role: 'officer', agency_id: null },
          params: { id: String(complaintA.id) },
          body: { message },
        }),
        res, next()
      );
      expect(res._s.statusCode).toBe(400);
      expect(res._s.body.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
