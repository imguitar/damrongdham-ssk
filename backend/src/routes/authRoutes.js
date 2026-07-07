'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const lineAuthController = require('../controllers/lineAuthController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Brute-force protection on staff login (per IP) — does not affect normal use
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'staff-auth' });

router.post('/login', loginLimiter, authController.login);

// Staff personal LINE link + DM preferences (authenticated)
const staffLineLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'staff-line' });
router.post('/line/link/init', authenticate, staffLineLimiter, lineAuthController.staffLineLinkInit);
router.get('/line/link', authenticate, lineAuthController.staffLineLinkStatus);
router.delete('/line/link', authenticate, lineAuthController.staffLineUnlink);
router.get('/line/preferences', authenticate, lineAuthController.getUserNotificationPreferences);
router.patch('/line/preferences', authenticate, lineAuthController.updateUserNotificationPreferences);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
