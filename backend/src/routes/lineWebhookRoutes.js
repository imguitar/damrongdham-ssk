'use strict';

const router = require('express').Router();
const lineWebhookController = require('../controllers/lineWebhookController');

// LINE Messaging API webhook (public, signature-verified inside the controller)
router.post('/webhook', lineWebhookController.handle);

module.exports = router;
