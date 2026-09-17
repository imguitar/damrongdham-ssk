'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/citizenAdminController');

// จัดการสมาชิกประชาชน — ผู้ดูแลระบบสูงสุดเท่านั้น (ข้อมูลส่วนบุคคลของประชาชน)
router.use(authenticate, authorize('super_admin'));

router.get('/',            ctrl.list);
router.get('/:id',         ctrl.getById);
router.put('/:id',         ctrl.update);
router.patch('/:id/status', ctrl.setStatus);

module.exports = router;
