'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const agencyController = require('../controllers/agencyController');

const STAFF_ROLES = ['super_admin', 'admin', 'officer', 'chief', 'agency_officer', 'agency_head', 'executive'];
const ADMIN_ROLES = ['super_admin', 'admin'];

router.use(authenticate);

router.get('/',    authorize(...STAFF_ROLES), agencyController.list);
router.get('/:id', authorize(...STAFF_ROLES), agencyController.getById);
router.post('/',   authorize(...ADMIN_ROLES), agencyController.create);
router.put('/:id', authorize(...ADMIN_ROLES), agencyController.update);
router.patch('/:id/toggle-status', authorize(...ADMIN_ROLES), agencyController.toggleStatus);

module.exports = router;
