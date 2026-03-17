const adminService = require("../services/adminService");
const { isValidDateString, isValidObjectId, parsePositiveInt } = require("../utils/requestValidation");

const USER_ROLES = new Set(["", "all", "player", "owner", "admin"]);
const USER_STATUSES = new Set(["", "all", "active", "blocked"]);
const COURT_STATUSES = new Set(["", "all", "pending", "approved", "suspended", "rejected"]);

async function getUsers(req, res, next) {
  try {
    const role = req.query.role || "";
    const status = req.query.status || "";
    if (!USER_ROLES.has(role)) {
      return res.status(400).json({ success: false, message: "Invalid role filter." });
    }
    if (!USER_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: "Invalid user status filter." });
    }

    const result = await adminService.listUsers({
      keyword: req.query.keyword || "",
      role,
      status,
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 20, 100),
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: result.items,
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function patchUserStatus(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }
    const { status } = req.body;
    const updated = await adminService.updateUserStatus({
      userId: req.params.id,
      status,
      actorUserId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCourts(req, res, next) {
  try {
    const status = req.query.status || "";
    if (!COURT_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: "Invalid court status filter." });
    }

    const result = await adminService.listCourts({
      keyword: req.query.keyword || "",
      status,
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 20, 100),
    });

    return res.status(200).json({
      success: true,
      message: "Courts fetched successfully.",
      data: result.items,
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCourtDetail(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid court id." });
    }
    const court = await adminService.getCourtDetail(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Court detail fetched successfully.",
      data: court,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCourtSlots(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid court id." });
    }
    if (req.query.date && !isValidDateString(req.query.date)) {
      return res.status(400).json({ success: false, message: "date must be in YYYY-MM-DD format." });
    }
    const slots = await adminService.getCourtSlots(req.params.id, req.query.date || "");
    return res.status(200).json({
      success: true,
      message: "Court slots fetched successfully.",
      data: slots,
    });
  } catch (error) {
    return next(error);
  }
}

async function patchCourtStatus(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid court id." });
    }
    const { status } = req.body;
    const updated = await adminService.updateCourtStatus({
      courtId: req.params.id,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Court status updated successfully.",
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function getOverviewReport(req, res, next) {
  try {
    const report = await adminService.getOverviewReport();
    return res.status(200).json({
      success: true,
      message: "Overview report fetched successfully.",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMonthlyReport(req, res, next) {
  try {
    const year = req.query.year;
    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 3000) {
        return res.status(400).json({ success: false, message: "year must be a valid YYYY value." });
      }
    }

    const report = await adminService.getMonthlyReport(req.query.year);
    return res.status(200).json({
      success: true,
      message: "Monthly report fetched successfully.",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  patchUserStatus,
  getCourts,
  getCourtDetail,
  getCourtSlots,
  patchCourtStatus,
  getOverviewReport,
  getMonthlyReport,
};
