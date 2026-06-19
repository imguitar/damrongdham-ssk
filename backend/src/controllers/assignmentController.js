'use strict';

const pool = require('../config/database');
const assignmentModel = require('../models/assignmentModel');
const complaintModel = require('../models/complaintModel');
const { validateTransition, changeStatus, AGENCY_ROLES } = require('../services/complaintService');
const { success, error } = require('../utils/response');
const { writeAuditLog } = require('../middleware/auditLog');

// Check agency ownership for all assignment actions
const checkAgencyAccess = (req, assignment) => {
  if (!AGENCY_ROLES.includes(req.user.role)) return 'ไม่มีสิทธิ์ดำเนินการนี้';
  if (req.user.agency_id !== assignment.agency_id) return 'หน่วยงานของคุณไม่ตรงกับเรื่องที่มอบหมาย';
  return null;
};

// GET /api/complaints/:id/assignments
const list = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);
    const assignments = await assignmentModel.findByComplaintId(req.params.id);
    return success(res, { assignments });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/assignments/:id/accept — T-04: ASSIGNED → ACCEPTED
const accept = async (req, res, next) => {
  try {
    const assignment = await assignmentModel.findById(req.params.id);
    if (!assignment) return error(res, 'NOT_FOUND', 'ไม่พบบันทึกการมอบหมาย', 404);

    const accessErr = checkAgencyAccess(req, assignment);
    if (accessErr) return error(res, 'FORBIDDEN', accessErr, 403);

    const complaint = await complaintModel.findById(assignment.complaint_id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const { valid, to, message } = validateTransition(complaint.status, 'accept', req.user.role);
    if (!valid) return error(res, 'INVALID_TRANSITION', message, 400);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await assignmentModel.accept(conn, assignment.id, req.user.id);
      await changeStatus(conn, complaint.id, complaint.status, to, req.user.id);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    writeAuditLog({ userId: req.user.id, action: 'ACCEPT_ASSIGNMENT', resource: 'assignments', resourceId: assignment.id, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const updated = await assignmentModel.findById(assignment.id);
    return success(res, { assignment: updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/assignments/:id/return — T-05: ASSIGNED → RETURNED, T-07: ACCEPTED → RETURNED
const returnComplaint = async (req, res, next) => {
  try {
    const assignment = await assignmentModel.findById(req.params.id);
    if (!assignment) return error(res, 'NOT_FOUND', 'ไม่พบบันทึกการมอบหมาย', 404);

    const accessErr = checkAgencyAccess(req, assignment);
    if (accessErr) return error(res, 'FORBIDDEN', accessErr, 403);

    const { return_reason } = req.body;
    if (!return_reason || !String(return_reason).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุเหตุผลการส่งคืน', 400);
    }

    const complaint = await complaintModel.findById(assignment.complaint_id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const { valid, to, message } = validateTransition(complaint.status, 'return', req.user.role);
    if (!valid) return error(res, 'INVALID_TRANSITION', message, 400);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await assignmentModel.setReturned(conn, assignment.id, return_reason);
      await changeStatus(conn, complaint.id, complaint.status, to, req.user.id, return_reason);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    writeAuditLog({ userId: req.user.id, action: 'RETURN_ASSIGNMENT', resource: 'assignments', resourceId: assignment.id, details: { return_reason }, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const updated = await assignmentModel.findById(assignment.id);
    return success(res, { assignment: updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/assignments/:id/start — T-06: ACCEPTED → IN_PROGRESS
const start = async (req, res, next) => {
  try {
    const assignment = await assignmentModel.findById(req.params.id);
    if (!assignment) return error(res, 'NOT_FOUND', 'ไม่พบบันทึกการมอบหมาย', 404);

    const accessErr = checkAgencyAccess(req, assignment);
    if (accessErr) return error(res, 'FORBIDDEN', accessErr, 403);

    const complaint = await complaintModel.findById(assignment.complaint_id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const { valid, to, message } = validateTransition(complaint.status, 'start', req.user.role);
    if (!valid) return error(res, 'INVALID_TRANSITION', message, 400);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await changeStatus(conn, complaint.id, complaint.status, to, req.user.id);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    writeAuditLog({ userId: req.user.id, action: 'START_ASSIGNMENT', resource: 'assignments', resourceId: assignment.id, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const updated = await assignmentModel.findById(assignment.id);
    return success(res, { assignment: updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/assignments/:id/resolve — T-08: IN_PROGRESS → RESOLVED
const resolve = async (req, res, next) => {
  try {
    const assignment = await assignmentModel.findById(req.params.id);
    if (!assignment) return error(res, 'NOT_FOUND', 'ไม่พบบันทึกการมอบหมาย', 404);

    const accessErr = checkAgencyAccess(req, assignment);
    if (accessErr) return error(res, 'FORBIDDEN', accessErr, 403);

    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุผลการดำเนินงาน (content)', 400);
    }

    const complaint = await complaintModel.findById(assignment.complaint_id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const { valid, to, message } = validateTransition(complaint.status, 'resolve', req.user.role);
    if (!valid) return error(res, 'INVALID_TRANSITION', message, 400);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await changeStatus(conn, complaint.id, complaint.status, to, req.user.id, null, { last_progress_at: new Date() });
      await conn.query(
        `INSERT INTO complaint_updates (complaint_id, assignment_id, update_type, content, updated_by, created_at)
         VALUES (?, ?, 'RESULT', ?, ?, NOW())`,
        [complaint.id, assignment.id, content, req.user.id]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    writeAuditLog({ userId: req.user.id, action: 'RESOLVE_ASSIGNMENT', resource: 'assignments', resourceId: assignment.id, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const updated = await assignmentModel.findById(assignment.id);
    return success(res, { assignment: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, accept, returnComplaint, start, resolve };
