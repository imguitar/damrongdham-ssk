'use strict';

const mysql = require('mysql2/promise');

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

module.exports = pool;
