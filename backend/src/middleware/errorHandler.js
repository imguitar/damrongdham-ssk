'use strict';

const multer = require('multer');

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  // Multer file size limit error → 400
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'ขนาดไฟล์เกิน 10 MB' },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    process.env.NODE_ENV === 'production'
      ? 'เกิดข้อผิดพลาดภายในระบบ'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = { notFound, errorHandler };
