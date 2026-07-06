'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Brute-force protection on staff login (per IP) — does not affect normal use
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'staff-auth' });

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
