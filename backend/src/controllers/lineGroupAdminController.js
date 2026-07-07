'use strict';

const crypto = require('crypto');
const lineGroupModel = require('../models/lineGroupModel');
const { writeAuditLog } = require('../middleware/auditLog');
const { success, error } = require('../utils/response');

const ADMIN_ROLES = ['super_admin', 'admin'];
const PAIRING_TTL_MINUTES = 30;

const isAdmin = (req) => ADMIN_ROLES.includes(req.user.role);
// non-admin (agency_head/officer) may only manage their own agency's groups
const ownsAgency = (req, agencyId) => agencyId != null && req.user.agency_id === agencyId;

// generate a readable 8-char code (no ambiguous chars)
const genCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};

// POST /api/admin/line-groups/pairing-code
const createPairingCode = async (req, res, next) => {
  try {
    const { scope, agency_id, label } = req.body;
    if (!['center', 'agency'].includes(scope)) {
      return error(res, 'VALIDATION_ERROR', 'scope ต้องเป็น center หรือ agency', 400);
    }
    const agencyId = scope === 'agency' ? Number(agency_id) : null;
    if (scope === 'agency' && !agencyId) {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุหน่วยงาน (agency_id)', 400);
    }

    // authorization: admins → any; agency staff → own agency only, and only agency scope
    if (!isAdmin(req)) {
      if (scope === 'center' || !ownsAgency(req, agencyId)) {
        return error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์ออกรหัสสำหรับหน่วยงานนี้', 403);
      }
    }

    const code = genCode();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MINUTES * 60 * 1000);
    await lineGroupModel.createPairingCode({
      code, scope, agencyId, label, createdBy: req.user.id, expiresAt,
    });

    return success(res, { code, scope, agency_id: agencyId, label: label || null, expires_at: expiresAt, ttl_minutes: PAIRING_TTL_MINUTES }, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/line-groups
const listGroups = async (req, res, next) => {
  try {
    const targets = isAdmin(req)
      ? await lineGroupModel.listTargets()
      : await lineGroupModel.listTargets({ agencyId: req.user.agency_id });
    return success(res, { groups: targets });
  } catch (err) {
    next(err);
  }
};

const loadTargetWithAccess = async (req, res) => {
  const target = await lineGroupModel.getTargetById(Number(req.params.id));
  if (!target) { error(res, 'NOT_FOUND', 'ไม่พบกลุ่ม', 404); return null; }
  if (!isAdmin(req) && !ownsAgency(req, target.agency_id)) {
    error(res, 'FORBIDDEN', 'ไม่มีสิทธิ์จัดการกลุ่มนี้', 403); return null;
  }
  return target;
};

// PATCH /api/admin/line-groups/:id  (toggle is_active / event flags)
const updateGroup = async (req, res, next) => {
  try {
    const target = await loadTargetWithAccess(req, res);
    if (!target) return undefined;
    await lineGroupModel.updateTarget(target.id, req.body); // whitelisted columns only
    const updated = await lineGroupModel.getTargetById(target.id);
    return success(res, { group: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/line-groups/:id  (unbind)
const deleteGroup = async (req, res, next) => {
  try {
    const target = await loadTargetWithAccess(req, res);
    if (!target) return undefined;
    await lineGroupModel.deleteTarget(target.id);
    writeAuditLog({
      userId: req.user.id, action: 'LINE_GROUP_UNBOUND', resource: 'line_group', resourceId: target.id,
      details: { reason: 'admin_unbind' }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, { message: 'ยกเลิกการเชื่อมต่อกลุ่มแล้ว' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPairingCode, listGroups, updateGroup, deleteGroup };
