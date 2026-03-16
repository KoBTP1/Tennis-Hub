const Court = require("../models/Court");
const CourtSlot = require("../models/CourtSlot");
const Favorite = require("../models/Favorite");
const notificationService = require("./notificationService");
const { escapeRegex } = require("../utils/requestValidation");

async function searchCourts({ keyword, location, page = 1, limit = 20, userId = "" }) {
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

  let favoriteCourtIdSet = new Set();
  if (userId && items.length > 0) {
    const favorites = await Favorite.find({
      userId,
      courtId: { $in: items.map((item) => item._id) },
    })
      .select("courtId")
      .lean();
    favoriteCourtIdSet = new Set(favorites.map((item) => String(item.courtId)));
  }

  const total = await Court.countDocuments(query);

  return {
    items: items.map((item) => ({
      ...item,
      isFavorited: favoriteCourtIdSet.has(String(item._id)),
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
}

async function getCourtDetails(courtId, userId = "") {
  const court = await Court.findOne({ _id: courtId, status: "approved", isDeleted: { $ne: true } })
    .populate("ownerId", "name")
    .lean();
  if (!court) {
    const error = new Error("Court not found");
    error.statusCode = 404;
    throw error;
  }
  if (!userId) {
    return court;
  }
  const favorite = await Favorite.findOne({ userId, courtId }).select("_id").lean();
  return {
    ...court,
    isFavorited: Boolean(favorite),
  };
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

async function toggleFavorite({ userId, courtId }) {
  const court = await Court.findOne({ _id: courtId, status: "approved", isDeleted: { $ne: true } });
  if (!court) {
    const error = new Error("Court not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = await Favorite.findOne({ userId, courtId });
  if (existing) {
    await Favorite.deleteOne({ _id: existing._id });
    return { isFavorited: false };
  }

  await Favorite.create({ userId, courtId });
  if (String(court.ownerId) !== String(userId)) {
    await notificationService.createNotification({
      recipientId: court.ownerId,
      actorId: userId,
      type: "court_liked",
      title: "Court liked",
      message: `A player liked your court "${court.name}".`,
      metadata: { courtId: court._id.toString() },
    });
  }
  return { isFavorited: true };
}

module.exports = {
  searchCourts,
  getCourtDetails,
  getAvailableSlots,
  toggleFavorite,
};
