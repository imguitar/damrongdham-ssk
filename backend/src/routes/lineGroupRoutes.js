'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/lineGroupAdminController');

// staff console — manage LINE group targets. Center admins + agency leads.
const MANAGE_ROLES = ['super_admin', 'admin', 'chief', 'officer', 'agency_head'];

router.use(authenticate);

router.post('/pairing-code', authorize(...MANAGE_ROLES), ctrl.createPairingCode);
router.get('/',              authorize(...MANAGE_ROLES), ctrl.listGroups);
router.patch('/:id',         authorize(...MANAGE_ROLES), ctrl.updateGroup);
router.delete('/:id',        authorize(...MANAGE_ROLES), ctrl.deleteGroup);

module.exports = router;
