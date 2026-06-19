'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const auditLogController = require('../controllers/auditLogController');

router.use(authenticate);

const ADMIN_ROLES = ['super_admin', 'admin'];

router.get('/',    authorize(...ADMIN_ROLES), auditLogController.list);
router.get('/:id', authorize(...ADMIN_ROLES), auditLogController.getById);

module.exports = router;
