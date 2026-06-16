const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MySQL Connection Pool
// ============================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'damrongdham_user',
  password: process.env.DB_PASSWORD || 'damrongdham_pass',
  database: process.env.DB_NAME || 'damrongdham_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ============================================
// Routes
// ============================================

// Health Check - ตรวจสอบสถานะ Backend และ Database
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';

  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    dbStatus = 'connected';
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  }

  res.json({
    status: 'ok',
    message: 'Damrongdham SSK Backend is running!',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ตัวอย่าง API Route
app.get('/api', (req, res) => {
  res.json({
    message: 'ยินดีต้อนรับสู่ Damrongdham SSK API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
    },
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ================================================
  🚀 Damrongdham SSK Backend Server
  ================================================
  🌐 Server:    http://localhost:${PORT}
  📡 API:       http://localhost:${PORT}/api
  💊 Health:    http://localhost:${PORT}/api/health
  🔧 Mode:      ${process.env.NODE_ENV || 'development'}
  ================================================
  `);
});
