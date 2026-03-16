const Notification = require("../models/Notification");

function sanitizeNotification(item) {
  return {
    id: item._id.toString(),
    type: item.type,
    title: item.title,
    message: item.message,
    metadata: item.metadata || {},
    isRead: Boolean(item.isRead),
    readAt: item.readAt || null,
    createdAt: item.createdAt,
  };
}

async function createNotification({ recipientId, actorId = null, type, title, message, metadata = {} }) {
  if (!recipientId || !type || !title || !message) {
    return null;
  }
  const created = await Notification.create({
    recipientId,
    actorId: actorId || null,
    type,
    title,
    message,
    metadata: metadata || {},
  });
  return sanitizeNotification(created);
}

async function listMyNotifications({ userId, page = 1, limit = 20 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const query = { recipientId: userId };
  const [total, unreadCount, items] = await Promise.all([
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, isRead: false }),
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
  ]);
  return {
    items: items.map(sanitizeNotification),
    unreadCount,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function markAsRead({ userId, notificationId }) {
  const item = await Notification.findOne({ _id: notificationId, recipientId: userId });
  if (!item) {
    const error = new Error("Notification not found.");
    error.statusCode = 404;
    throw error;
  }
  if (!item.isRead) {
    item.isRead = true;
    item.readAt = new Date();
    await item.save();
  }
  return sanitizeNotification(item);
}

async function markAllAsRead({ userId }) {
  await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
}

module.exports = {
  createNotification,
  listMyNotifications,
  markAsRead,
  markAllAsRead,
};
