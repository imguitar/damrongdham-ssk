'use strict';

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config();

const app = express();

// MySQL Connection Pool
// Phase 3 will move this to src/config/database.js
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'damrongdham_user',
  password: process.env.DB_PASSWORD || 'damrongdham_pass',
  database: process.env.DB_NAME || 'damrongdham_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00',
});

app.locals.db = pool;

// ============================================
// Middleware
// ============================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API Routes
// ============================================

// Health Check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';

  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbStatus = 'connected';
  } catch (err) {
    console.error('DB health check error:', err.message);
  }

  res.json({
    success: true,
    data: {
      status: 'ok',
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Damrongdham DCMS API',
      version: '1.0.0',
      description: 'ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัดศรีสะเกษ',
    },
  });
});

// ============================================
// Serve Frontend (Production)
// ============================================
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback — all non-API routes serve index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = { app, pool };
