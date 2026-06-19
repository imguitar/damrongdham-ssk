'use strict';

const router = require('express').Router();
const { upload } = require('../config/upload');
const { validateComplaint } = require('../middleware/validate');
const publicController = require('../controllers/publicController');

// Public master data (no auth required, active only)
router.get('/master-data/categories', publicController.getPublicCategories);
router.get('/master-data/channels', publicController.getPublicChannels);
router.get('/master-data/provinces', publicController.getPublicProvinces);
router.get('/master-data/districts', publicController.getPublicDistricts);
router.get('/master-data/service-types', publicController.getPublicServiceTypes);
router.get('/master-data/complaint-natures', publicController.getPublicComplaintNatures);
router.get('/master-data/complainant-types', publicController.getPublicComplainantTypes);

// Public complaint submission (no auth)
router.post('/complaints', validateComplaint, publicController.submitComplaint);
router.post('/complaints/attachments', upload.single('file'), publicController.uploadPublicAttachment);

// Public complaint tracking (no auth)
router.get('/complaints/track/:complaint_number', publicController.trackComplaint);

module.exports = router;
