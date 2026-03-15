const courtService = require("../services/courtService");
const { isValidDateString, isValidObjectId, parsePositiveInt } = require("../utils/requestValidation");

async function getCourts(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
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
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid court id." });
    }
    const court = await courtService.getCourtDetails(id);

    return res.status(200).json({
      success: true,
      message: "Court details retrieved successfully",
      data: court,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCourtSlots(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid court id." });
    }
    if (date && !isValidDateString(date)) {
      return res.status(400).json({ success: false, message: "date must be in YYYY-MM-DD format." });
    }
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
