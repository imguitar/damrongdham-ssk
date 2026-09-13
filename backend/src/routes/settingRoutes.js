'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const settingController = require('../controllers/settingController');

router.use(authenticate, authorize('super_admin', 'admin'));
router.get('/', settingController.getSettings);
router.put('/', settingController.updateSettings);

module.exports = router;

