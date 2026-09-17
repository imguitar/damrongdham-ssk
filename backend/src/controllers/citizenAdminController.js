'use strict';

const citizenAdminModel = require('../models/citizenAdminModel');
const { success, successList, error } = require('../utils/response');
const { parsePagination, paginationMeta } = require('../utils/pagination');
const { writeAuditLog } = require('../middleware/auditLog');
const { digitsOnly, isValidThaiIdCard, isValidThaiPhone } = require('../utils/thaiValidators');

const audit = (req, action, resourceId, details) =>
  writeAuditLog({
    userId: req.user.id,
    action,
    resource: 'citizens',
    resourceId,
    details,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

// GET /api/admin/citizens
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { search, is_active, login_type } = req.query;
    const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;
    const { rows, total } = await citizenAdminModel.findAll({
      search: search ? String(search).trim() : undefined,
      isActive,
      loginType: login_type,
      limit,
      offset,
    });
    return successList(res, rows, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/citizens/:id
const getById = async (req, res, next) => {
  try {
    const citizen = await citizenAdminModel.findById(req.params.id);
    if (!citizen) return error(res, 'NOT_FOUND', 'ไม่พบสมาชิก', 404);
    return success(res, { citizen });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/citizens/:id — แก้ไขข้อมูลส่วนตัว (ไม่รวมอีเมล/รหัสผ่าน)
const update = async (req, res, next) => {
  try {
    const current = await citizenAdminModel.findById(req.params.id);
    if (!current) return error(res, 'NOT_FOUND', 'ไม่พบสมาชิก', 404);

    const fullName = String(req.body.full_name ?? '').trim();
    const phone = digitsOnly(req.body.phone);
    const idCard = digitsOnly(req.body.id_card);
    const address = String(req.body.address ?? '').trim();

    if (!fullName) return error(res, 'VALIDATION_ERROR', 'กรุณาระบุชื่อ-นามสกุล', 400);
    if (fullName.length > 255) return error(res, 'VALIDATION_ERROR', 'ชื่อ-นามสกุลยาวเกินไป', 400);
    if (phone && !isValidThaiPhone(phone)) {
      return error(res, 'VALIDATION_ERROR', 'เบอร์โทรศัพท์ไม่ถูกต้อง (ขึ้นต้นด้วย 0, 9–10 หลัก)', 400);
    }
    if (idCard && !isValidThaiIdCard(idCard)) {
      return error(res, 'VALIDATION_ERROR', 'เลขบัตรประชาชนไม่ถูกต้อง (13 หลัก)', 400);
    }

    await citizenAdminModel.updateProfile(current.id, {
      full_name: fullName, phone, id_card: idCard, address,
    });

    // บันทึกเฉพาะชื่อช่องที่เปลี่ยน — ไม่คัดลอกข้อมูลส่วนบุคคลลง audit log
    const changed = Object.entries({ full_name: fullName, phone, id_card: idCard, address })
      .filter(([k, v]) => (current[k] || '') !== (v || ''))
      .map(([k]) => k);
    audit(req, 'UPDATE_CITIZEN', current.id, { changed_fields: changed });

    return success(res, { citizen: await citizenAdminModel.findById(current.id) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/citizens/:id/status — เปิด/ปิดการใช้งานบัญชี
const setStatus = async (req, res, next) => {
  try {
    if (typeof req.body.is_active !== 'boolean') {
      return error(res, 'VALIDATION_ERROR', 'กรุณาระบุ is_active เป็น true หรือ false', 400);
    }
    const current = await citizenAdminModel.findById(req.params.id);
    if (!current) return error(res, 'NOT_FOUND', 'ไม่พบสมาชิก', 404);

    await citizenAdminModel.setActive(current.id, req.body.is_active);
    audit(req, req.body.is_active ? 'ACTIVATE_CITIZEN' : 'DEACTIVATE_CITIZEN', current.id, {});

    return success(res, { is_active: req.body.is_active });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, update, setStatus };
