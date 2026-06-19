'use strict';

const express = require('express');
const citizenAuthController = require('../controllers/citizenAuthController');
const { citizenAuthenticate } = require('../middleware/citizenAuth');

const router = express.Router();

router.post('/register', citizenAuthController.register);
router.post('/login', citizenAuthController.login);
router.post('/logout', citizenAuthenticate, citizenAuthController.logout);
router.get('/me', citizenAuthenticate, citizenAuthController.me);
router.put('/change-password', citizenAuthenticate, citizenAuthController.changePassword);

module.exports = router;
