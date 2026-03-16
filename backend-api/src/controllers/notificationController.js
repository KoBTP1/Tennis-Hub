const notificationService = require("../services/notificationService");
const { isValidObjectId, parsePositiveInt } = require("../utils/requestValidation");

async function getMyNotifications(req, res, next) {
  try {
    const result = await notificationService.listMyNotifications({
      userId: req.user.userId,
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 20, 100),
    });
    return res.status(200).json({
      success: true,
      data: result.items,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function patchRead(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification id." });
    }
    const item = await notificationService.markAsRead({
      userId: req.user.userId,
      notificationId: req.params.id,
    });
    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: item,
    });
  } catch (error) {
    return next(error);
  }
}

async function patchReadAll(req, res, next) {
  try {
    await notificationService.markAllAsRead({ userId: req.user.userId });
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyNotifications,
  patchRead,
  patchReadAll,
};
