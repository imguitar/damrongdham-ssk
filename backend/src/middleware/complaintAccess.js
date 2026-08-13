'use strict';

const pool = require('../config/database');
const complaintModel = require('../models/complaintModel');
const { error } = require('../utils/response');

// เจ้าหน้าที่หน่วยงานเข้าถึงได้เฉพาะเรื่องที่มอบหมายให้หน่วยงานตน
// (ศูนย์/แอดมิน/ผู้บริหาร เห็นได้ทุกเรื่อง). ใช้ร่วมกันทั้ง route middleware
// และการตรวจซ้ำระดับไฟล์แนบ (download/remove ที่อ้างด้วย attachment id)
const AGENCY_ROLES = ['agency_officer', 'agency_head'];

const hasAgencyAccess = async (complaintId, agencyId) => {
  if (!agencyId) return false;
  const [[row]] = await pool.query(
    'SELECT 1 AS ok FROM complaint_assignments WHERE complaint_id = ? AND agency_id = ? LIMIT 1',
    [complaintId, agencyId]
  );
  return Boolean(row);
};

// คืน true เมื่อผู้ใช้ปัจจุบันเข้าถึงเรื่องนี้ได้ — ถ้าไม่ผ่านจะส่ง 403 เองแล้วคืน false
const ensureAgencyAccess = async (req, res, complaintId) => {
  if (!AGENCY_ROLES.includes(req.user.role)) return true;
  const ok = await hasAgencyAccess(complaintId, req.user.agency_id);
  if (!ok) {
    error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงเรื่องนี้', 403);
    return false;
  }
  return true;
};

// Route middleware สำหรับ route ที่มี :id ของเรื่องร้องเรียน
// โหลดเรื่อง + ตรวจ ownership ของหน่วยงาน แล้วแนบไว้ที่ req.complaint
const requireComplaintAccess = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    if (!(await ensureAgencyAccess(req, res, complaint.id))) return undefined;
    req.complaint = complaint;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireComplaintAccess, hasAgencyAccess, ensureAgencyAccess, AGENCY_ROLES };
