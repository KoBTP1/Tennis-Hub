const adminService = require("../services/adminService");

async function getUsers(req, res, next) {
  try {
    const result = await adminService.listUsers({
      keyword: req.query.keyword || "",
      role: req.query.role || "",
      status: req.query.status || "",
      page: req.query.page || 1,
      limit: req.query.limit || 20,
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
    const result = await adminService.listCourts({
      keyword: req.query.keyword || "",
      status: req.query.status || "",
      page: req.query.page || 1,
      limit: req.query.limit || 20,
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

async function patchCourtStatus(req, res, next) {
  try {
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
  patchCourtStatus,
  getOverviewReport,
  getMonthlyReport,
};
