'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const dashboardController = require('../controllers/dashboardController');

// All dashboard endpoints require login
router.use(authenticate);

const ALL_STAFF   = ['super_admin', 'admin', 'officer', 'chief', 'agency_officer', 'agency_head', 'executive'];
const REPORT_ROLES = ['super_admin', 'admin', 'officer', 'chief', 'executive'];
const CENTER_ADMIN = ['super_admin', 'admin', 'officer', 'chief'];

// All staff (agency-scoped automatically)
router.get('/summary',     authorize(...ALL_STAFF),    dashboardController.summary);
router.get('/by-status',   authorize(...ALL_STAFF),    dashboardController.byStatus);

// Center + executive roles only
router.get('/by-category', authorize(...REPORT_ROLES), dashboardController.byCategory);
router.get('/by-agency',   authorize(...REPORT_ROLES), dashboardController.byAgency);
router.get('/by-district', authorize(...REPORT_ROLES), dashboardController.byDistrict);
router.get('/trend',       authorize(...REPORT_ROLES), dashboardController.trend);

// Center admin (no executive, no agency)
router.get('/overdue',     authorize(...CENTER_ADMIN),  dashboardController.overdue);
router.get('/near-due',    authorize(...CENTER_ADMIN),  dashboardController.nearDue);

module.exports = router;
