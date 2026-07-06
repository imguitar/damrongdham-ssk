'use strict';

const express = require('express');
const citizenAuthController = require('../controllers/citizenAuthController');
const lineAuthController = require('../controllers/lineAuthController');
const { citizenAuthenticate } = require('../middleware/citizenAuth');

const router = express.Router();

router.post('/register', citizenAuthController.register);
router.post('/login', citizenAuthController.login);

// LINE Login (citizens only) — public, no auth
router.get('/line', lineAuthController.lineLogin);
router.get('/line/callback', lineAuthController.lineCallback);
router.post('/logout', citizenAuthenticate, citizenAuthController.logout);
router.get('/me', citizenAuthenticate, citizenAuthController.me);
router.put('/change-password', citizenAuthenticate, citizenAuthController.changePassword);

module.exports = router;
