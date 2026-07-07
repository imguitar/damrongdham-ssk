'use strict';

const messaging = require('../services/lineMessagingService');
const webhookService = require('../services/lineWebhookService');

// POST /api/line/webhook — LINE Messaging API webhook (signature-verified, public)
const handle = (req, res) => {
  const signature = req.headers['x-line-signature'];

  // req.rawBody is captured by the express.json verify hook (see app.js)
  if (!messaging.verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'invalid signature' } });
  }

  const events = Array.isArray(req.body?.events) ? req.body.events : [];

  // Respond 200 immediately, then process asynchronously (LINE expects a fast ack)
  res.status(200).end();
  webhookService.handleEvents(events).catch((err) => console.error('[LineWebhook] handle error:', err.message));
};

module.exports = { handle };
