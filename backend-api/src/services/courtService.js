const Court = require("../models/Court");
const CourtSlot = require("../models/CourtSlot");
const { escapeRegex } = require("../utils/requestValidation");

async function searchCourts({ keyword, location, page = 1, limit = 20 }) {
  const query = { status: "approved", isDeleted: { $ne: true } };
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    query.$or = [{ name: regex }, { location: regex }];
  }
  if (location) {
    query.location = new RegExp(escapeRegex(location), "i");
  }

  const skip = (page - 1) * limit;
  const items = await Court.find(query)
    .populate("ownerId", "name")
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Court.countDocuments(query);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function getCourtDetails(courtId) {
  const court = await Court.findOne({ _id: courtId, status: "approved", isDeleted: { $ne: true } })
    .populate("ownerId", "name")
    .lean();
  if (!court) {
    const error = new Error("Court not found");
    error.statusCode = 404;
    throw error;
  }
  return court;
}

async function getAvailableSlots(courtId, date) {
  const court = await Court.findOne({ _id: courtId, status: "approved", isDeleted: { $ne: true } })
    .select("_id")
    .lean();
  if (!court) {
    const error = new Error("Court not found");
    error.statusCode = 404;
    throw error;
  }

  const query = { courtId, isBooked: false };
  if (date) {
    query.date = date; // Expecting YYYY-MM-DD
  }

  // Sort by date and startTime
  const slots = await CourtSlot.find(query).sort({ date: 1, startTime: 1 }).lean();
  return slots.map(slot => ({
    ...slot,
    status: slot.isBooked ? "booked" : "available"
  }));
}

module.exports = {
  searchCourts,
  getCourtDetails,
  getAvailableSlots,
};
