'use strict';

const pool = require('../config/database');
const complaintModel = require('../models/complaintModel');
const complaintUpdateModel = require('../models/complaintUpdateModel');
const outboxSvc = require('../services/notificationOutboxService');
const { success, error } = require('../utils/response');

const VALID_TYPES = ['PROGRESS', 'RESULT', 'REVIEW_NOTE'];

// POST /api/complaints/:id/updates
const create = async (req, res, next) => {
  try {
    const { content, update_type, assignment_id, is_public } = req.body;

    if (!content || !String(content).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุเนื้อหาการอัปเดต', 400);
    }
    if (!update_type || !VALID_TYPES.includes(update_type)) {
      return error(res, 'VALIDATION_ERROR', `update_type ต้องเป็นหนึ่งใน: ${VALID_TYPES.join(', ')}`, 400);
    }

    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    // Owner + reference for citizen notification (unmasked, direct)
    const [[owner]] = await pool.query(
      'SELECT citizen_id, complaint_number FROM complaints WHERE id = ?',
      [complaint.id]
    );
    const isPublic = Boolean(is_public);

    const conn = await pool.getConnection();
    let id;
    try {
      await conn.beginTransaction();

      id = await complaintUpdateModel.create({
        complaintId: complaint.id,
        assignmentId: assignment_id || null,
        updateType: update_type,
        content: content.trim(),
        updatedBy: req.user.id,
        isPublic,
      }, conn);

      // Reset escalation clock when agency posts a PROGRESS update
      if (update_type === 'PROGRESS') {
        await conn.query(
          'UPDATE complaints SET last_progress_at = NOW(), escalation_level = 0, updated_at = NOW() WHERE id = ?',
          [complaint.id]
        );
      }

      // Public updates notify the citizen; internal notes never do (§14)
      if (isPublic && owner?.citizen_id) {
        await outboxSvc.enqueue(conn, {
          eventType: 'COMPLAINT_PROGRESS_UPDATED',
          citizenId: owner.citizen_id,
          complaintId: complaint.id,
          idempotencyKey: `complaint:${complaint.id}:progress:update:${id}`,
        });
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return success(res, { id, message: 'บันทึกการอัปเดตเรียบร้อย' }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
