'use strict';

const path = require('path');
const fs = require('fs');
const attachmentModel = require('../models/attachmentModel');
const complaintModel = require('../models/complaintModel');
const { writeAuditLog } = require('../middleware/auditLog');
const { success, error } = require('../utils/response');
const { UPLOAD_DIR } = require('../config/upload');

const list = async (req, res, next) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const attachments = await attachmentModel.findByComplaintId(req.params.id);
    return success(res, { attachments });
  } catch (err) {
    next(err);
  }
};

const upload = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'VALIDATION_ERROR', 'กรุณาแนบไฟล์', 400);

    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return error(res, 'NOT_FOUND', 'ไม่พบเรื่องร้องเรียน', 404);

    const id = await attachmentModel.create({
      complaintId: req.params.id,
      updateId: req.body.update_id || null,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user.id,
      uploadSource: 'STAFF',
    });

    writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'complaint_attachments',
      resourceId: id,
      details: { complaint_id: req.params.id, file_name: req.file.originalname },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const attachment = await attachmentModel.findById(id);
    return success(res, { attachment }, 201);
  } catch (err) {
    next(err);
  }
};

const download = async (req, res, next) => {
  try {
    const attachment = await attachmentModel.findById(req.params.id);
    if (!attachment) return error(res, 'NOT_FOUND', 'ไม่พบไฟล์แนบ', 404);

    const safeName = path.basename(attachment.file_path);
    const fullPath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(fullPath)) {
      return error(res, 'NOT_FOUND', 'ไม่พบไฟล์ในระบบ', 404);
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(attachment.file_name)}`
    );
    res.setHeader('Content-Type', attachment.file_type);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const attachment = await attachmentModel.findById(req.params.id);
    if (!attachment) return error(res, 'NOT_FOUND', 'ไม่พบไฟล์แนบ', 404);

    await attachmentModel.remove(req.params.id);

    writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'complaint_attachments',
      resourceId: req.params.id,
      details: { file_name: attachment.file_name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return success(res, { message: 'ลบไฟล์แนบสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, upload, download, remove };
