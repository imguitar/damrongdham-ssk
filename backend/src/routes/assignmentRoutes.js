'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const assignmentController = require('../controllers/assignmentController');

const AGENCY_ROLES = ['agency_officer', 'agency_head'];

router.use(authenticate);

router.patch('/:id/accept',  authorize(...AGENCY_ROLES), assignmentController.accept);
router.patch('/:id/return',  authorize(...AGENCY_ROLES), assignmentController.returnComplaint);
router.patch('/:id/start',   authorize(...AGENCY_ROLES), assignmentController.start);
router.patch('/:id/resolve', authorize(...AGENCY_ROLES), assignmentController.resolve);

module.exports = router;
