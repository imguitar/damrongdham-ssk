'use strict';

const express = require('express');
const citizenAuthController = require('../controllers/citizenAuthController');
const lineAuthController = require('../controllers/lineAuthController');
const { citizenAuthenticate } = require('../middleware/citizenAuth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Brute-force protection on credential + OAuth endpoints (per IP)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'citizen-auth' });
const lineLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'citizen-line' });

router.post('/register', authLimiter, citizenAuthController.register);
router.post('/login', authLimiter, citizenAuthController.login);

// LINE Login (citizens only) — public, no auth
router.get('/line', lineLimiter, lineAuthController.lineLogin);
router.get('/line/callback', lineLimiter, lineAuthController.lineCallback);
router.post('/logout', citizenAuthenticate, citizenAuthController.logout);
router.get('/me', citizenAuthenticate, citizenAuthController.me);
router.put('/change-password', citizenAuthenticate, citizenAuthController.changePassword);
router.post('/set-credentials', citizenAuthenticate, citizenAuthController.setCredentials);

module.exports = router;
