'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateComplaint } = require('../middleware/validate');
const { upload } = require('../config/upload');
const complaintController = require('../controllers/complaintController');
const attachmentController = require('../controllers/attachmentController');

const STAFF_ROLES = ['super_admin', 'admin', 'officer', 'agency_head', 'agency_officer'];
const ADMIN_ROLES = ['super_admin', 'admin'];

// All staff routes require authentication
router.use(authenticate);

// Complaint CRUD
router.get('/', authorize(STAFF_ROLES), complaintController.list);
router.post('/', authorize(STAFF_ROLES), validateComplaint, complaintController.create);
router.get('/:id', authorize(STAFF_ROLES), complaintController.getById);
router.put('/:id', authorize(STAFF_ROLES), complaintController.update);

// Timeline & Updates
router.get('/:id/timeline', authorize(STAFF_ROLES), complaintController.getTimeline);
router.get('/:id/updates', authorize(STAFF_ROLES), complaintController.getUpdates);

// Reveal identity — super_admin only
router.post('/:id/reveal-identity', authorize(['super_admin']), complaintController.revealIdentity);

// Attachments
router.get('/:id/attachments', authorize(STAFF_ROLES), attachmentController.list);
router.post('/:id/attachments', authorize(STAFF_ROLES), upload.single('file'), attachmentController.upload);
router.get('/attachments/:id/download', authorize(STAFF_ROLES), attachmentController.download);
router.delete('/attachments/:id', authorize(ADMIN_ROLES), attachmentController.remove);

module.exports = router;
