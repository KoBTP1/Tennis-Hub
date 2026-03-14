const Court = require("../models/Court");
const CourtSlot = require("../models/CourtSlot");

async function searchCourts({ keyword, location, page = 1, limit = 20 }) {
  const query = { status: "active" };
  if (keyword) {
    query.name = { $regex: keyword, $options: "i" };
  }
  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  const skip = (page - 1) * limit;
  const items = await Court.find(query)
    .populate("ownerId", "name email phone")
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
  const court = await Court.findById(courtId).populate("ownerId", "name email phone").lean();
  if (!court) {
    throw new Error("Court not found");
  }
  return court;
}

async function getAvailableSlots(courtId, date) {
  const query = { courtId };
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
