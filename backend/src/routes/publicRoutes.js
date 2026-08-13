'use strict';

const router = require('express').Router();
const { upload } = require('../config/upload');
const { validateComplaint } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimit');
const publicController = require('../controllers/publicController');

// กันสแปม/abuse บนช่องทางสาธารณะ (ไม่มี auth) — จำกัดตาม IP
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20, keyPrefix: 'public-submit',
  message: 'ยื่นเรื่องบ่อยเกินไป กรุณาลองใหม่อีกครั้งภายหลัง',
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 60, keyPrefix: 'public-upload',
  message: 'อัปโหลดไฟล์บ่อยเกินไป กรุณาลองใหม่อีกครั้งภายหลัง',
});

// Public master data (no auth required, active only)
router.get('/master-data/categories', publicController.getPublicCategories);
router.get('/master-data/channels', publicController.getPublicChannels);
router.get('/master-data/provinces', publicController.getPublicProvinces);
router.get('/master-data/districts', publicController.getPublicDistricts);
router.get('/master-data/service-types', publicController.getPublicServiceTypes);
router.get('/master-data/complaint-natures', publicController.getPublicComplaintNatures);
router.get('/master-data/complainant-types', publicController.getPublicComplainantTypes);
router.get('/master-data/subdistricts', publicController.getPublicSubdistricts);

// Public complaint submission (no auth)
router.post('/complaints', submitLimiter, validateComplaint, publicController.submitComplaint);
router.post('/complaints/attachments', uploadLimiter, upload.single('file'), publicController.uploadPublicAttachment);

// Public complaint tracking (no auth)
router.get('/complaints/track/:complaint_number', publicController.trackComplaint);

module.exports = router;
