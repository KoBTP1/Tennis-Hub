const Booking = require("../models/Booking");
const Court = require("../models/Court");
const User = require("../models/User");
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

function buildUserKeywordFilter(keyword) {
  if (!keyword) {
    return null;
  }

  const regex = new RegExp(escapeRegex(keyword), "i");
  return {
    $or: [{ name: regex }, { email: regex }, { phone: regex }],
  };
}

function sanitizeUser(user) {
  return {
    mongoId: user._id.toString(),
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.isBlocked ? "blocked" : "active",
    joinedAt: user.createdAt,
  };
}

function sanitizeCourt(court) {
  return {
    mongoId: court._id.toString(),
    id: court.id,
    name: court.name,
    location: court.location,
    ownerName: court.ownerName || "",
    pricePerHour: court.pricePerHour || 0,
    rating: court.rating || 0,
    reviewsCount: court.reviewsCount || 0,
    status: court.status,
    createdAt: court.createdAt,
  };
}

async function listUsers({ keyword = "", role = "", status = "", page = 1, limit = 20 }) {
  const safePage = parsePage(page, 1);
  const safeLimit = Math.min(parsePage(limit, 20), 100);
  const query = {};

  const keywordFilter = buildUserKeywordFilter(keyword.trim());
  if (keywordFilter) {
    Object.assign(query, keywordFilter);
  }

  if (role && role !== "all") {
    query.role = role;
  }

  if (status === "active") {
    query.isBlocked = false;
  } else if (status === "blocked") {
    query.isBlocked = true;
  }

  const [total, users, byRole, byStatus] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$isBlocked", count: { $sum: 1 } } }]),
  ]);

  const roleStats = { player: 0, owner: 0, admin: 0 };
  byRole.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(roleStats, item._id)) {
      roleStats[item._id] = item.count;
    }
  });

  const statusStats = { active: 0, blocked: 0 };
  byStatus.forEach((item) => {
    if (item._id) {
      statusStats.blocked = item.count;
    } else {
      statusStats.active = item.count;
    }
  });

  return {
    items: users.map(sanitizeUser),
    stats: {
      totalUsers: roleStats.player + roleStats.owner + roleStats.admin,
      byRole: roleStats,
      byStatus: statusStats,
    },
    pagination: buildPagination(safePage, safeLimit, total),
  };
}

async function updateUserStatus({ userId, status, actorUserId }) {
  if (!["active", "blocked"].includes(status)) {
    const error = new Error("Status must be active or blocked.");
    error.statusCode = 400;
    throw error;
  }

  if (String(userId) === String(actorUserId)) {
    const error = new Error("Admin cannot change their own status.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  user.isBlocked = status === "blocked";
  await user.save();

  return sanitizeUser(user);
}

async function listCourts({ keyword = "", status = "", page = 1, limit = 20 }) {
  const safePage = parsePage(page, 1);
  const safeLimit = Math.min(parsePage(limit, 20), 100);
  const query = {};

  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword.trim()), "i");
    query.$or = [{ name: regex }, { location: regex }, { ownerName: regex }];
  }
  query.isDeleted = { $ne: true };

  if (status && status !== "all") {
    query.status = status;
  }

  const [total, courts, byStatus] = await Promise.all([
    Court.countDocuments(query),
    Court.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Court.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusStats = { pending: 0, approved: 0, suspended: 0, rejected: 0 };
  byStatus.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(statusStats, item._id)) {
      statusStats[item._id] = item.count;
    }
  });

  return {
    items: courts.map(sanitizeCourt),
    stats: {
      totalCourts:
        statusStats.pending + statusStats.approved + statusStats.suspended + statusStats.rejected,
      byStatus: statusStats,
    },
    pagination: buildPagination(safePage, safeLimit, total),
  };
}

async function updateCourtStatus({ courtId, status }) {
  if (!["pending", "approved", "suspended", "rejected"].includes(status)) {
    const error = new Error("Invalid court status.");
    error.statusCode = 400;
    throw error;
  }

  const court = await Court.findOne({ _id: courtId, isDeleted: { $ne: true } });
  if (!court) {
    const error = new Error("Court not found.");
    error.statusCode = 404;
    throw error;
  }

  court.status = status;
  await court.save();
  return sanitizeCourt(court);
}

async function getOverviewReport() {
  const revenueExpr = { $ifNull: ["$totalPrice", 0] };
  const [totalUsers, totalCourts, totalBookings, statusAgg, revenueAgg, topCourtsAgg] = await Promise.all([
    User.countDocuments({}),
    Court.countDocuments({}),
    Booking.countDocuments({}),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: revenueExpr } } },
    ]),
    Booking.aggregate([
      { $group: { _id: "$courtId", totalBookings: { $sum: 1 }, revenue: { $sum: revenueExpr } } },
      { $sort: { totalBookings: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "courts",
          localField: "_id",
          foreignField: "_id",
          as: "court",
        },
      },
      { $unwind: { path: "$court", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          courtId: "$_id",
          courtName: { $ifNull: ["$court.name", "Unknown Court"] },
          totalBookings: 1,
          revenue: 1,
        },
      },
    ]),
  ]);

  const bookingStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  statusAgg.forEach((item) => {
    if (item?._id && Object.prototype.hasOwnProperty.call(bookingStatus, item._id)) {
      bookingStatus[item._id] = item.count;
    }
  });

  return {
    totals: {
      users: totalUsers,
      courts: totalCourts,
      bookings: totalBookings,
      revenue: revenueAgg[0]?.totalRevenue || 0,
      activeBookings: (bookingStatus.pending || 0) + (bookingStatus.confirmed || 0),
    },
    bookingStatus,
    topCourts: topCourtsAgg,
  };
}

async function getMonthlyReport(year) {
  const revenueExpr = { $ifNull: ["$totalPrice", 0] };
  const selectedYear = Number(year) || new Date().getFullYear();
  const startDate = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`);

  const monthlyData = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        bookings: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, 0, revenueExpr],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthMap = new Map(monthlyData.map((item) => [item._id, item]));
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const item = monthMap.get(monthNumber);
    return {
      month: monthNumber,
      bookings: item?.bookings || 0,
      revenue: item?.revenue || 0,
    };
  });

  return {
    year: selectedYear,
    months,
  };
}

module.exports = {
  listUsers,
  updateUserStatus,
  listCourts,
  updateCourtStatus,
  getOverviewReport,
  getMonthlyReport,
};
