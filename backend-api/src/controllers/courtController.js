const courtService = require("../services/courtService");

async function getCourts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || "";
    const location = req.query.location || "";
    
    const result = await courtService.searchCourts({ keyword, location, page, limit });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return next(error);
  }
}

async function getCourtDetails(req, res, next) {
  try {
    const { id } = req.params;
    const court = await courtService.getCourtDetails(id);

    return res.status(200).json({
      success: true,
      message: "Court details retrieved successfully",
      data: court,
    });
  } catch (error) {
    res.status(404);
    return next(error);
  }
}

async function getCourtSlots(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const slots = await courtService.getAvailableSlots(id, date);

    return res.status(200).json({
      success: true,
      message: "Available slots retrieved successfully",
      data: slots,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCourts,
  getCourtDetails,
  getCourtSlots,
};
