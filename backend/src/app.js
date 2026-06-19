'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const corsOptions = require('./config/cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/authRoutes');
const citizenAuthRouter = require('./routes/citizenAuthRoutes');

const app = express();

// ============================================
// Middleware
// ============================================
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API Routes
// ============================================
app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/citizen/auth', citizenAuthRouter);

// ============================================
// Serve Frontend (Production)
// ============================================
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback — all non-API routes serve index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================
// Error Handling (must be last)
// ============================================
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
