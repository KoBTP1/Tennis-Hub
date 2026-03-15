const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Court = require("../models/Court");
const CourtSlot = require("../models/CourtSlot");
const { getNextSequence } = require("../utils/sequence");
const { escapeRegex } = require("../utils/requestValidation");

function parsePage(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function toMinutes(timeString) {
  const [hour, minute] = String(timeString || "").split(":").map((n) => Number(n));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

function ensureValidSlotTime(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || start >= end) {
    const error = new Error("Invalid slot time range.");
    error.statusCode = 400;
    throw error;
  }
}

function sanitizeCourt(court) {
  return {
    numericId: court.id,
    id: court._id.toString(),
    name: court.name,
    location: court.location,
    pricePerHour: court.pricePerHour || 0,
    description: court.description || "",
    images: court.images || [],
    status: court.status,
    createdAt: court.createdAt,
  };
}

function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }
  return images.map((item) => String(item || "").trim()).filter(Boolean);
}

function sanitizeSlot(slot) {
  return {
    id: slot._id.toString(),
    courtId: slot.courtId.toString(),
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isBooked: Boolean(slot.isBooked),
    status: slot.isBooked ? "booked" : "available",
  };
}

function sanitizeBooking(booking) {
  return {
    id: booking._id.toString(),
    status: booking.status,
    totalPrice: booking.totalPrice || 0,
    bookingDate: booking.bookingDate,
    createdAt: booking.createdAt,
    court: booking.courtId
      ? {
          id: booking.courtId._id?.toString?.() || booking.courtId.toString(),
          name: booking.courtId.name,
          location: booking.courtId.location,
          pricePerHour: booking.courtId.pricePerHour || 0,
          images: Array.isArray(booking.courtId.images) ? booking.courtId.images : [],
        }
      : null,
    slot: booking.slotId
      ? {
          id: booking.slotId._id?.toString?.() || booking.slotId.toString(),
          date: booking.slotId.date,
          startTime: booking.slotId.startTime,
          endTime: booking.slotId.endTime,
        }
      : null,
    player: booking.userId
      ? {
          id: booking.userId._id?.toString?.() || booking.userId.toString(),
          name: booking.userId.name,
          email: booking.userId.email,
          phone: booking.userId.phone || "",
        }
      : null,
  };
}

async function getOwnedCourtOrThrow({ courtId, ownerId, session = undefined }) {
  const court = await Court.findById(courtId).session(session);
  if (!court || court.isDeleted) {
    const error = new Error("Court not found.");
    error.statusCode = 404;
    throw error;
  }
  if (String(court.ownerId) !== String(ownerId)) {
    const error = new Error("Not allowed to access this court.");
    error.statusCode = 403;
    throw error;
  }
  return court;
}

async function listOwnerCourts({ ownerId, keyword = "", status = "", page = 1, limit = 20 }) {
  const safePage = parsePage(page, 1);
  const safeLimit = Math.min(parsePage(limit, 20), 100);
  const query = { ownerId, isDeleted: { $ne: true } };

  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword.trim()), "i");
    query.$or = [{ name: regex }, { location: regex }];
  }

  if (status && status !== "all") {
    query.status = status;
  }

  const [total, courts] = await Promise.all([
    Court.countDocuments(query),
    Court.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
  ]);

  return {
    items: courts.map(sanitizeCourt),
    pagination: buildPagination(safePage, safeLimit, total),
  };
}

async function createOwnerCourt({ ownerId, payload }) {
  const { name, location, pricePerHour, description = "", images = [] } = payload || {};
  const normalizedName = String(name || "").trim();
  const normalizedLocation = String(location || "").trim();
  if (!normalizedName || !normalizedLocation || pricePerHour === undefined) {
    const error = new Error("name, location and pricePerHour are required.");
    error.statusCode = 400;
    throw error;
  }
  const parsedPrice = Number(pricePerHour);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    const error = new Error("pricePerHour must be a valid number >= 0.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedImages = normalizeImages(images);
  const nextId = await getNextSequence("court_id");

  const court = await Court.create({
    id: nextId,
    name: normalizedName,
    location: normalizedLocation,
    pricePerHour: parsedPrice,
    description: String(description || "").trim(),
    images: normalizedImages,
    ownerId,
    status: "pending",
    isDeleted: false,
  });

  return sanitizeCourt(court);
}

async function updateOwnerCourt({ ownerId, courtId, payload }) {
  const court = await getOwnedCourtOrThrow({ ownerId, courtId });
  const { name, location, pricePerHour, description, images } = payload || {};

  if (name !== undefined) {
    const normalizedName = String(name).trim();
    if (!normalizedName) {
      const error = new Error("name cannot be empty.");
      error.statusCode = 400;
      throw error;
    }
    court.name = normalizedName;
  }
  if (location !== undefined) {
    const normalizedLocation = String(location).trim();
    if (!normalizedLocation) {
      const error = new Error("location cannot be empty.");
      error.statusCode = 400;
      throw error;
    }
    court.location = normalizedLocation;
  }
  if (pricePerHour !== undefined) {
    const parsedPrice = Number(pricePerHour);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      const error = new Error("pricePerHour must be a valid number >= 0.");
      error.statusCode = 400;
      throw error;
    }
    court.pricePerHour = parsedPrice;
  }
  if (description !== undefined) {
    court.description = String(description).trim();
  }
  if (images !== undefined) {
    court.images = normalizeImages(images);
  }

  await court.save();
  return sanitizeCourt(court);
}

async function deleteOwnerCourt({ ownerId, courtId }) {
  const court = await getOwnedCourtOrThrow({ ownerId, courtId });
  // Soft-delete court to preserve bookings/payments history.
  court.isDeleted = true;
  court.deletedAt = new Date();
  await court.save();
  return { id: court._id.toString() };
}

async function listOwnerSlots({ ownerId, courtId, date = "" }) {
  await getOwnedCourtOrThrow({ ownerId, courtId });
  const query = { courtId };
  if (date) {
    query.date = String(date).trim();
  }
  const slots = await CourtSlot.find(query).sort({ date: 1, startTime: 1 });
  return slots.map(sanitizeSlot);
}

async function ensureNoSlotOverlap({ courtId, date, startTime, endTime, excludeSlotId = null, session = undefined }) {
  const dateSlots = await CourtSlot.find({ courtId, date }).session(session);
  const nextStart = toMinutes(startTime);
  const nextEnd = toMinutes(endTime);

  const hasOverlap = dateSlots.some((slot) => {
    if (excludeSlotId && String(slot._id) === String(excludeSlotId)) {
      return false;
    }
    const currentStart = toMinutes(slot.startTime);
    const currentEnd = toMinutes(slot.endTime);
    return nextStart < currentEnd && currentStart < nextEnd;
  });

  if (hasOverlap) {
    const error = new Error("Slot overlaps with existing slot.");
    error.statusCode = 400;
    throw error;
  }
}

async function createOwnerSlot({ ownerId, courtId, payload }) {
  const { date, startTime, endTime } = payload || {};
  if (!date || !startTime || !endTime) {
    const error = new Error("date, startTime and endTime are required.");
    error.statusCode = 400;
    throw error;
  }
  ensureValidSlotTime(startTime, endTime);
  const normalizedDate = String(date).trim();
  const normalizedStart = String(startTime).trim();
  const normalizedEnd = String(endTime).trim();

  // Retry transient transaction conflicts when concurrent owner updates happen.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let createdSlot = null;
      await session.withTransaction(async () => {
        const court = await getOwnedCourtOrThrow({ ownerId, courtId, session });
        // Touch court doc so concurrent slot writes on same court conflict deterministically.
        court.slotRevision = Number(court.slotRevision || 0) + 1;
        await court.save({ session });

        await ensureNoSlotOverlap({
          courtId,
          date: normalizedDate,
          startTime: normalizedStart,
          endTime: normalizedEnd,
          session,
        });

        const [slot] = await CourtSlot.create(
          [
            {
              courtId,
              date: normalizedDate,
              startTime: normalizedStart,
              endTime: normalizedEnd,
              isBooked: false,
            },
          ],
          { session }
        );
        createdSlot = slot;
      });
      return sanitizeSlot(createdSlot);
    } catch (error) {
      if (error?.code === 11000) {
        error.statusCode = 409;
        error.message = "Slot overlaps with existing slot.";
      }
      if (attempt === 2 || !error?.errorLabels?.includes("TransientTransactionError")) {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }
  const error = new Error("Unable to create slot due to concurrent updates. Please retry.");
  error.statusCode = 409;
  throw error;
}

async function getOwnedSlotOrThrow({ ownerId, slotId, session = undefined }) {
  const slot = await CourtSlot.findById(slotId).session(session);
  if (!slot) {
    const error = new Error("Slot not found.");
    error.statusCode = 404;
    throw error;
  }
  await getOwnedCourtOrThrow({ ownerId, courtId: slot.courtId, session });
  return slot;
}

async function updateOwnerSlot({ ownerId, slotId, payload }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let updatedSlot = null;
      await session.withTransaction(async () => {
        const slot = await getOwnedSlotOrThrow({ ownerId, slotId, session });
        if (slot.isBooked) {
          const error = new Error("Cannot update booked slot.");
          error.statusCode = 400;
          throw error;
        }

        const nextDate = payload?.date !== undefined ? String(payload.date).trim() : slot.date;
        const nextStartTime = payload?.startTime !== undefined ? String(payload.startTime).trim() : slot.startTime;
        const nextEndTime = payload?.endTime !== undefined ? String(payload.endTime).trim() : slot.endTime;

        ensureValidSlotTime(nextStartTime, nextEndTime);
        const ownedCourt = await getOwnedCourtOrThrow({ ownerId, courtId: slot.courtId, session });
        ownedCourt.slotRevision = Number(ownedCourt.slotRevision || 0) + 1;
        await ownedCourt.save({ session });

        await ensureNoSlotOverlap({
          courtId: slot.courtId,
          date: nextDate,
          startTime: nextStartTime,
          endTime: nextEndTime,
          excludeSlotId: slot._id,
          session,
        });

        slot.date = nextDate;
        slot.startTime = nextStartTime;
        slot.endTime = nextEndTime;
        await slot.save({ session });
        updatedSlot = slot;
      });
      return sanitizeSlot(updatedSlot);
    } catch (error) {
      if (error?.code === 11000) {
        error.statusCode = 409;
        error.message = "Slot overlaps with existing slot.";
      }
      if (attempt === 2 || !error?.errorLabels?.includes("TransientTransactionError")) {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }
  const error = new Error("Unable to update slot due to concurrent updates. Please retry.");
  error.statusCode = 409;
  throw error;
}

async function deleteOwnerSlot({ ownerId, slotId }) {
  const slot = await getOwnedSlotOrThrow({ ownerId, slotId });
  if (slot.isBooked) {
    const error = new Error("Cannot delete booked slot.");
    error.statusCode = 400;
    throw error;
  }
  await CourtSlot.deleteOne({ _id: slot._id });
  return { id: slot._id.toString() };
}

async function listOwnerBookings({ ownerId, status = "all", page = 1, limit = 20 }) {
  const ownerCourts = await Court.find({ ownerId }).select("_id");
  const courtIds = ownerCourts.map((court) => court._id);
  if (!courtIds.length) {
    return {
      items: [],
      pagination: buildPagination(1, Number(limit) || 20, 0),
    };
  }

  const safePage = parsePage(page, 1);
  const safeLimit = Math.min(parsePage(limit, 20), 100);
  const query = { courtId: { $in: courtIds } };
  if (status && status !== "all") {
    query.status = status;
  }

  const [total, items] = await Promise.all([
    Booking.countDocuments(query),
    Booking.find(query)
      .populate("userId", "name email phone")
      .populate("courtId", "name location pricePerHour images")
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
  ]);

  return {
    items: items.map(sanitizeBooking),
    pagination: buildPagination(safePage, safeLimit, total),
  };
}

async function updateOwnerBookingStatus({ ownerId, bookingId, status }) {
  if (!["confirmed", "completed", "cancelled"].includes(status)) {
    const error = new Error("Invalid booking status.");
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = 404;
    throw error;
  }

  const court = await Court.findById(booking.courtId);
  if (!court || String(court.ownerId) !== String(ownerId)) {
    const error = new Error("Not allowed to update this booking.");
    error.statusCode = 403;
    throw error;
  }

  if (status === booking.status) {
    const populatedSame = await Booking.findById(booking._id)
      .populate("userId", "name email phone")
      .populate("courtId", "name location pricePerHour images")
      .populate("slotId", "date startTime endTime");
    return sanitizeBooking(populatedSame);
  }

  const allowedTransitions = {
    pending: new Set(["confirmed", "cancelled"]),
    confirmed: new Set(["completed", "cancelled"]),
    completed: new Set([]),
    cancelled: new Set([]),
  };
  const currentStatus = booking.status;
  if (!allowedTransitions[currentStatus]?.has(status)) {
    const error = new Error(`Cannot change booking status from ${currentStatus} to ${status}.`);
    error.statusCode = 400;
    throw error;
  }

  if (status === "cancelled" && booking.paymentStatus === "paid") {
    const error = new Error("Paid booking cannot be cancelled automatically. Please contact support for refund.");
    error.statusCode = 400;
    throw error;
  }

  booking.status = status;
  await booking.save();

  if (status === "cancelled") {
    const slot = await CourtSlot.findById(booking.slotId);
    if (slot) {
      slot.isBooked = false;
      await slot.save();
    }
  }

  const populated = await Booking.findById(booking._id)
    .populate("userId", "name email phone")
    .populate("courtId", "name location pricePerHour images")
    .populate("slotId", "date startTime endTime");
  return sanitizeBooking(populated);
}

async function getOwnerDashboard({ ownerId }) {
  const courts = await Court.find({ ownerId }).select("_id");
  const courtIds = courts.map((court) => court._id);
  if (!courtIds.length) {
    return {
      totals: { courts: 0, bookings: 0, activeBookings: 0, revenue: 0 },
      recentBookings: [],
    };
  }

  const revenueExpr = { $ifNull: ["$totalPrice", 0] };
  const [totalBookings, activeBookings, revenueAgg, recentBookings] = await Promise.all([
    Booking.countDocuments({ courtId: { $in: courtIds } }),
    Booking.countDocuments({ courtId: { $in: courtIds }, status: { $in: ["pending", "confirmed"] } }),
    Booking.aggregate([
      { $match: { courtId: { $in: courtIds }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: revenueExpr } } },
    ]),
    Booking.find({ courtId: { $in: courtIds } })
      .populate("userId", "name email phone")
      .populate("courtId", "name location pricePerHour images")
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  return {
    totals: {
      courts: courtIds.length,
      bookings: totalBookings,
      activeBookings,
      revenue: revenueAgg[0]?.totalRevenue || 0,
    },
    recentBookings: recentBookings.map(sanitizeBooking),
  };
}

module.exports = {
  listOwnerCourts,
  createOwnerCourt,
  updateOwnerCourt,
  deleteOwnerCourt,
  listOwnerSlots,
  createOwnerSlot,
  updateOwnerSlot,
  deleteOwnerSlot,
  listOwnerBookings,
  updateOwnerBookingStatus,
  getOwnerDashboard,
};
