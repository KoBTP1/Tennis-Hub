const ownerService = require("../services/ownerService");
const {
  isValidDateString,
  isValidObjectId,
  parsePositiveInt,
} = require("../utils/requestValidation");

const OWNER_COURT_STATUSES = new Set([
  "all",
  "pending",
  "approved",
  "suspended",
  "rejected",
]);
const OWNER_BOOKING_STATUSES = new Set([
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

async function getDashboard(req, res, next) {
  try {
    const data = await ownerService.getOwnerDashboard({
      ownerId: req.user.userId,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function getCourts(req, res, next) {
  try {
    const status = req.query.status || "all";
    if (!OWNER_COURT_STATUSES.has(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid court status filter." });
    }

    const result = await ownerService.listOwnerCourts({
      ownerId: req.user.userId,
      keyword: req.query.keyword || "",
      status,
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 20, 100),
    });
    return res
      .status(200)
      .json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
  } catch (error) {
    return next(error);
  }
}

async function getCourtDetail(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid court id." });
    }

    const court = await ownerService.getOwnerCourtDetail({
      ownerId: req.user.userId,
      courtId: req.params.id,
    });
    return res.status(200).json({ success: true, data: court });
  } catch (error) {
    return next(error);
  }
}

async function createCourt(req, res, next) {
  try {
    const court = await ownerService.createOwnerCourt({
      ownerId: req.user.userId,
      payload: req.body,
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Court created successfully.",
        data: court,
      });
  } catch (error) {
    return next(error);
  }
}

async function patchCourt(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid court id." });
    }
    const court = await ownerService.updateOwnerCourt({
      ownerId: req.user.userId,
      courtId: req.params.id,
      payload: req.body,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Court updated successfully.",
        data: court,
      });
  } catch (error) {
    return next(error);
  }
}

async function deleteCourt(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid court id." });
    }
    const result = await ownerService.deleteOwnerCourt({
      ownerId: req.user.userId,
      courtId: req.params.id,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Court deleted successfully.",
        data: result,
      });
  } catch (error) {
    return next(error);
  }
}

async function getSlots(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid court id." });
    }
    if (req.query.date && !isValidDateString(req.query.date)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "date must be in YYYY-MM-DD format.",
        });
    }

    const slots = await ownerService.listOwnerSlots({
      ownerId: req.user.userId,
      courtId: req.params.id,
      date: req.query.date || "",
    });
    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    return next(error);
  }
}

async function createSlot(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid court id." });
    }
    if (req.body?.date && !isValidDateString(req.body.date)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "date must be in YYYY-MM-DD format.",
        });
    }

    const slot = await ownerService.createOwnerSlot({
      ownerId: req.user.userId,
      courtId: req.params.id,
      payload: req.body,
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Slot created successfully.",
        data: slot,
      });
  } catch (error) {
    return next(error);
  }
}

async function patchSlot(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slot id." });
    }
    if (req.body?.date && !isValidDateString(req.body.date)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "date must be in YYYY-MM-DD format.",
        });
    }

    const slot = await ownerService.updateOwnerSlot({
      ownerId: req.user.userId,
      slotId: req.params.id,
      payload: req.body,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Slot updated successfully.",
        data: slot,
      });
  } catch (error) {
    return next(error);
  }
}

async function deleteSlot(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slot id." });
    }
    const result = await ownerService.deleteOwnerSlot({
      ownerId: req.user.userId,
      slotId: req.params.id,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Slot deleted successfully.",
        data: result,
      });
  } catch (error) {
    return next(error);
  }
}

async function getBookings(req, res, next) {
  try {
    const status = req.query.status || "all";
    if (!OWNER_BOOKING_STATUSES.has(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking status filter." });
    }

    const result = await ownerService.listOwnerBookings({
      ownerId: req.user.userId,
      status,
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 20, 100),
    });
    return res
      .status(200)
      .json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
  } catch (error) {
    return next(error);
  }
}

async function patchBookingStatus(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking id." });
    }
    const booking = await ownerService.updateOwnerBookingStatus({
      ownerId: req.user.userId,
      bookingId: req.params.id,
      status: req.body.status,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Booking updated successfully.",
        data: booking,
      });
  } catch (error) {
    return next(error);
  }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required." });
    }

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    const normalizedPath = `/uploads/courts/${req.file.filename}`;
    const imageUrl = `${protocol}://${host}${normalizedPath}`;

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: {
        path: normalizedPath,
        url: imageUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboard,
  getCourts,
  getCourtDetail,
  createCourt,
  patchCourt,
  deleteCourt,
  getSlots,
  createSlot,
  patchSlot,
  deleteSlot,
  getBookings,
  patchBookingStatus,
  uploadImage,
};
