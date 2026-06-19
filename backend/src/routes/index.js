'use strict';

const express = require('express');
const pool = require('../config/database');
const { success } = require('../utils/response');

const router = express.Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbStatus = 'connected';
  } catch (err) {
    console.error('[Health] DB check failed:', err.message);
  }

  success(res, {
    status: 'ok',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

router.get('/', (req, res) => {
  success(res, {
    name: 'Damrongdham DCMS API',
    version: '1.0.0',
    description: 'ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัดศรีสะเกษ',
  });
});

module.exports = router;
