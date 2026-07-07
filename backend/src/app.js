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
const complaintRouter = require('./routes/complaintRoutes');
const masterDataRouter = require('./routes/masterDataRoutes');
const publicRouter = require('./routes/publicRoutes');
const citizenRouter = require('./routes/citizenRoutes');
const assignmentRouter = require('./routes/assignmentRoutes');
const agencyRouter = require('./routes/agencyRoutes');
const userRouter = require('./routes/userRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const reportRouter = require('./routes/reportRoutes');
const auditLogRouter = require('./routes/auditLogRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const lineWebhookRouter = require('./routes/lineWebhookRoutes');
const lineGroupRouter = require('./routes/lineGroupRoutes');

const app = express();

// Trust the Railway/reverse proxy so req.ip and req.secure reflect the real
// client (needed for accurate rate limiting and secure-cookie detection)
app.set('trust proxy', 1);

// ============================================
// Middleware
// ============================================
app.use(cors(corsOptions));
// capture the raw body so the LINE webhook can verify X-Line-Signature
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// API Routes
// ============================================
app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/citizen/auth', citizenAuthRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/master-data', masterDataRouter);
app.use('/api/public', publicRouter);
app.use('/api/citizen', citizenRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/agencies', agencyRouter);
app.use('/api/users', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportRouter);
app.use('/api/audit-logs', auditLogRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/line', lineWebhookRouter);
app.use('/api/admin/line-groups', lineGroupRouter);

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
