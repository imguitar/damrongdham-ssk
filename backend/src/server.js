'use strict';

require('dotenv').config();

const { app } = require('./app');

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
});
