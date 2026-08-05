'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateComplaint } = require('../middleware/validate');
const { upload } = require('../config/upload');
const complaintController = require('../controllers/complaintController');
const attachmentController = require('../controllers/attachmentController');
const assignmentController = require('../controllers/assignmentController');
const complaintUpdateController = require('../controllers/complaintUpdateController');
const lineComplaintController = require('../controllers/lineComplaintController');

const STAFF_ROLES = ['super_admin', 'admin', 'officer', 'chief', 'agency_head', 'agency_officer'];
const CENTER_ROLES = ['super_admin', 'admin', 'officer', 'chief'];
const ADMIN_ROLES = ['super_admin', 'admin'];
// ขอข้อมูลเพิ่มเติมจากประชาชนได้: ศูนย์ + หน่วยงานที่ถือเรื่อง (ตรวจ ownership ใน controller ซ้ำ)
const REQUEST_INFO_ROLES = ['super_admin', 'admin', 'officer', 'chief', 'agency_head', 'agency_officer'];

// All staff routes require authentication
router.use(authenticate);

// Complaint CRUD
router.get('/',    authorize(...STAFF_ROLES),  complaintController.list);
router.post('/',   authorize(...STAFF_ROLES),  validateComplaint, complaintController.create);
router.get('/:id', authorize(...STAFF_ROLES),  complaintController.getById);
router.put('/:id', authorize(...STAFF_ROLES),  complaintController.update);

// ── Status Workflow ─────────────────────────────────────────────────────────────
// T-01: NEW → SCREENING, T-12: RETURNED → SCREENING
router.patch('/:id/screen',    authorize(...CENTER_ROLES), complaintController.screen);
// T-03: SCREENING → REJECTED
router.patch('/:id/reject',    authorize(...CENTER_ROLES), complaintController.reject);
// T-02: SCREENING → ASSIGNED (creates assignment record)
router.post('/:id/assign',     authorize(...CENTER_ROLES), complaintController.assign);
// T-09: RESOLVED → REVIEWING
router.patch('/:id/review',    authorize(...CENTER_ROLES), complaintController.review);
// T-10: REVIEWING → CLOSED
router.patch('/:id/close',     authorize(...CENTER_ROLES), complaintController.close);
// T-11: REVIEWING → IN_PROGRESS
router.patch('/:id/send-back', authorize(...CENTER_ROLES), complaintController.sendBack);
// SCREENING → IN_PROGRESS (center handles itself)
router.patch('/:id/self-handle', authorize(...CENTER_ROLES), complaintController.selfHandle);

// ── Assignments list for a complaint ───────────────────────────────────────────
router.get('/:id/assignments', authorize(...STAFF_ROLES), assignmentController.list);

// ── Timeline & Updates ──────────────────────────────────────────────────────────
router.get('/:id/timeline',    authorize(...STAFF_ROLES), complaintController.getTimeline);
router.get('/:id/updates',     authorize(...STAFF_ROLES), complaintController.getUpdates);
router.post('/:id/updates',    authorize(...STAFF_ROLES), complaintUpdateController.create);

// ── LINE channel (แผงจัดการช่องทาง LINE ของเรื่อง) ─────────────────────────────
router.get('/:id/line',                        authorize(...STAFF_ROLES), lineComplaintController.getOverview);
// ขอข้อมูล/เอกสารเพิ่มเติมจากผู้ร้อง (ศูนย์ + หน่วยงานที่รับผิดชอบเรื่องนั้น)
router.get('/:id/info-requests',               authorize(...STAFF_ROLES), lineComplaintController.listInfoRequests);
router.post('/:id/info-requests',              authorize(...REQUEST_INFO_ROLES), lineComplaintController.createInfoRequest);
router.post('/:id/info-requests/:reqId/resend', authorize(...REQUEST_INFO_ROLES), lineComplaintController.resendInfoRequest);
router.patch('/:id/info-requests/:reqId/cancel', authorize(...REQUEST_INFO_ROLES), lineComplaintController.cancelInfoRequest);
// ส่งแจ้งผล/สถานะซ้ำทาง LINE (ไม่เปลี่ยนสถานะเรื่อง)
router.post('/:id/line/notify',                authorize(...CENTER_ROLES), lineComplaintController.notifyStatus);

// ── Reveal identity — super_admin only ─────────────────────────────────────────
router.post('/:id/reveal-identity', authorize('super_admin'), complaintController.revealIdentity);

// ── Delete complaint — super_admin only ────────────────────────────────────────
router.delete('/:id', authorize('super_admin'), complaintController.remove);

// ── Attachments ─────────────────────────────────────────────────────────────────
router.get('/:id/attachments',              authorize(...STAFF_ROLES), attachmentController.list);
router.post('/:id/attachments',             authorize(...STAFF_ROLES), upload.single('file'), attachmentController.upload);
router.get('/attachments/:id/download',     authorize(...STAFF_ROLES), attachmentController.download);
router.delete('/attachments/:id',           authorize(...ADMIN_ROLES), attachmentController.remove);

module.exports = router;
