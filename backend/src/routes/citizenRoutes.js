'use strict';

const router = require('express').Router();
const { citizenAuthenticate } = require('../middleware/citizenAuth');
const { upload } = require('../config/upload');
const { validateComplaint } = require('../middleware/validate');
const citizenController = require('../controllers/citizenController');

// All citizen routes require citizen JWT
router.use(citizenAuthenticate);

// Profile
router.put('/profile', citizenController.updateProfile);

// Complaints
router.post('/complaints', validateComplaint, citizenController.submitComplaint);
router.get('/complaints', citizenController.listMyComplaints);
router.get('/complaints/:complaint_number', citizenController.getMyComplaint);

// Attachments
router.post('/complaints/attachments', upload.single('file'), citizenController.uploadAttachment);

module.exports = router;
