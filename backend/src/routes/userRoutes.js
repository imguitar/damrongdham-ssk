'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const userController = require('../controllers/userController');

const ADMIN_ROLES = ['super_admin', 'admin'];

router.use(authenticate);

router.get('/',    authorize(...ADMIN_ROLES), userController.list);
router.get('/me',  authorize(...ADMIN_ROLES, 'officer', 'chief', 'agency_officer', 'agency_head', 'executive'), userController.getById);
router.get('/:id', authorize(...ADMIN_ROLES), userController.getById);
router.post('/',   authorize(...ADMIN_ROLES), userController.create);
router.put('/:id', authorize(...ADMIN_ROLES), userController.update);
router.patch('/:id/toggle-status',   authorize(...ADMIN_ROLES), userController.toggleStatus);
router.patch('/:id/reset-password',  authorize(...ADMIN_ROLES), userController.resetPassword);

module.exports = router;
