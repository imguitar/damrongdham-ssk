'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const reportController = require('../controllers/reportController');

router.use(authenticate);

const REPORT_ROLES  = ['super_admin', 'admin', 'officer', 'chief', 'executive'];
const EXPORT_ROLES  = [...REPORT_ROLES, 'agency_head'];

router.get('/monthly',      authorize(...REPORT_ROLES), reportController.monthly);
router.get('/by-category',  authorize(...REPORT_ROLES), reportController.byCategory);
router.get('/by-agency',    authorize(...REPORT_ROLES), reportController.byAgency);
router.get('/overdue',      authorize(...REPORT_ROLES), reportController.overdue);
router.get('/export/excel', authorize(...EXPORT_ROLES), reportController.exportExcel);

module.exports = router;
