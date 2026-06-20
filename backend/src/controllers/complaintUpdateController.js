'use strict';

const pool = require('../config/database');
const complaintModel = require('../models/complaintModel');
const complaintUpdateModel = require('../models/complaintUpdateModel');
const { success, error } = require('../utils/response');

const VALID_TYPES = ['PROGRESS', 'RESULT', 'REVIEW_NOTE'];

// POST /api/complaints/:id/updates
const create = async (req, res, next) => {
  try {
    const { content, update_type, assignment_id } = req.body;

    if (!content || !String(content).trim()) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุเนื้อหาการอัปเดต', 400);
    }
    if (!update_type || !VALID_TYPES.includes(update_type)) {
      return error(res, 'VALIDATION_ERROR', `update_type ต้องเป็นหนึ่งใน: ${VALID_TYPES.join(', ')}`, 400);
    }

    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const id = await complaintUpdateModel.create({
      complaintId: complaint.id,
      assignmentId: assignment_id || null,
      updateType: update_type,
      content: content.trim(),
      updatedBy: req.user.id,
    });

    // Reset escalation clock when agency posts a PROGRESS update
    if (update_type === 'PROGRESS') {
      await pool.query(
        'UPDATE complaints SET last_progress_at = NOW(), escalation_level = 0, updated_at = NOW() WHERE id = ?',
        [complaint.id]
      );
    }

    return success(res, { id, message: 'บันทึกการอัปเดตเรียบร้อย' }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
