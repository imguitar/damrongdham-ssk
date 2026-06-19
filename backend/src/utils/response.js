'use strict';

const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

// For list endpoints — returns { success, data: [...], pagination: { page, limit, total, totalPages } }
const successList = (res, data, pagination) => {
  return res.status(200).json({ success: true, data, pagination });
};

const error = (res, code, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = { success, successList, error };
