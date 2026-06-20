'use strict';

const notifModel = require('../models/notificationModel');
const { success, error } = require('../utils/response');

// GET /api/notifications?page=1&limit=20&unread_only=false
const list = async (req, res, next) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page)  || 1);
    const limit     = Math.min(50, parseInt(req.query.limit) || 20);
    const unreadOnly = req.query.unread_only === 'true';

    const { rows, total }  = await notifModel.findByUserId(req.user.id, { page, limit, unreadOnly });
    const unread_count     = await notifModel.countUnread(req.user.id);

    return success(res, {
      notifications: rows,
      unread_count,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications/unread-count  (for 30-second polling)
const unreadCount = async (req, res, next) => {
  try {
    const count = await notifModel.countUnread(req.user.id);
    return success(res, { count });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    const updated = await notifModel.markAllRead(req.user.id);
    return success(res, { updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return error(res, 'VALIDATION_ERROR', 'id ไม่ถูกต้อง', 400);
    const updated = await notifModel.markRead(id, req.user.id);
    if (!updated) return error(res, 'NOT_FOUND', 'ไม่พบการแจ้งเตือนหรืออ่านแล้ว', 404);
    return success(res, { updated: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, unreadCount, markAllRead, markRead };
