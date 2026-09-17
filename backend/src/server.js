'use strict';

require('dotenv').config();

const { app } = require('./app');
const { startAllJobs } = require('./jobs');
const complaintModel = require('./models/complaintModel');

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ============================================================
  Damrongdham DCMS — Backend Server
  ============================================================
  URL:    http://localhost:${PORT}
  API:    http://localhost:${PORT}/api
  Health: http://localhost:${PORT}/api/health
  Mode:   ${process.env.NODE_ENV || 'development'}
  ============================================================
  `);
  startAllJobs();

  // เรื่องเดิมก่อนมีรหัสติดตาม — สุ่มรหัสให้ (ต้องรัน migration 07 ก่อน)
  complaintModel.backfillTrackingCodes()
    .then((n) => { if (n) console.log(`[TrackingCode] backfilled ${n} complaint(s)`); })
    .catch((err) => console.error('[TrackingCode] backfill failed:', err.message));
});
