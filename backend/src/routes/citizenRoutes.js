'use strict';

const router = require('express').Router();
const { citizenAuthenticate } = require('../middleware/citizenAuth');
const { upload } = require('../config/upload');
const { validateComplaint } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimit');
const citizenController = require('../controllers/citizenController');
const lineAuthController = require('../controllers/lineAuthController');

// All citizen routes require citizen JWT
router.use(citizenAuthenticate);

// Profile
router.put('/profile', citizenController.updateProfile);
router.post('/complete-profile', citizenController.completeProfile);

// LINE account linking (authenticated) — link/unlink LINE to the current account
const lineLinkLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'citizen-line-link' });
router.post('/line/link/init', lineLinkLimiter, lineAuthController.lineLinkInit);
router.get('/line/link', lineAuthController.lineLinkStatus);
router.delete('/line/link', lineAuthController.lineUnlink);

// Notification preferences
router.get('/notification-preferences', citizenController.getNotificationPreferences);
router.patch('/notification-preferences', citizenController.updateNotificationPreferences);

// Complaints
router.post('/complaints', validateComplaint, citizenController.submitComplaint);
router.get('/complaints', citizenController.listMyComplaints);
router.get('/complaints/:complaint_number', citizenController.getMyComplaint);

// Attachments
router.post('/complaints/attachments', upload.single('file'), citizenController.uploadAttachment);

module.exports = router;
