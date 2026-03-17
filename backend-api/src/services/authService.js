const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Court = require("../models/Court");
const CourtSlot = require("../models/CourtSlot");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Favorite = require("../models/Favorite");
const Notification = require("../models/Notification");
const generateToken = require("../utils/generateToken");
const { getNextSequence } = require("../utils/sequence");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address || "",
    avatar: user.avatar || "",
    avatarUrl: user.avatar || "",
    role: user.role,
    status: user.isBlocked ? "blocked" : "active",
  };
}

async function register(payload) {
  const { name, email, password, phone = "", address = "" } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const nextId = await getNextSequence("user_id");

  const createdUser = await User.create({
    id: nextId,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim(),
    address: String(address || "").trim(),
    role: "player",
  });

  // Defense-in-depth: never allow privileged role from self-registration.
  if (createdUser.role !== "player") {
    createdUser.role = "player";
    await createdUser.save();
  }

  const token = generateToken(createdUser);
  return {
    token,
    user: sanitizeUser(createdUser),
  };
}

async function login(payload) {
  const { email, password } = payload;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = String(password);

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error("Your account has been blocked. Please contact admin.");
    error.statusCode = 403;
    throw error;
  }

  let isPasswordMatch = false;
  try {
    isPasswordMatch = await bcrypt.compare(normalizedPassword, user.password);
  } catch {
    isPasswordMatch = false;
  }

  // Backward compatibility for existing plain-text passwords, then migrate to hash.
  if (!isPasswordMatch && user.password === normalizedPassword) {
    const migratedHash = await bcrypt.hash(normalizedPassword, 10);
    user.password = migratedHash;
    await user.save();
    isPasswordMatch = true;
  }

  if (!isPasswordMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return {
    token,
    user: sanitizeUser(user),
  };
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, payload) {
  const { name, phone, address, currentPassword, newPassword, avatar } = payload || {};
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (name !== undefined) {
    user.name = String(name).trim();
  }

  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  if (address !== undefined) {
    user.address = String(address).trim();
  }

  if (avatar !== undefined) {
    user.avatar = String(avatar || "").trim();
  }

  if (newPassword !== undefined) {
    let isCurrentPasswordMatch = false;
    const normalizedCurrentPassword = String(currentPassword || "").trim();

    try {
      isCurrentPasswordMatch = await bcrypt.compare(normalizedCurrentPassword, user.password);
    } catch {
      isCurrentPasswordMatch = false;
    }

    // Backward compatibility for plain-text passwords that have not been migrated yet.
    if (!isCurrentPasswordMatch && user.password === normalizedCurrentPassword) {
      isCurrentPasswordMatch = true;
    }

    if (!isCurrentPasswordMatch) {
      const error = new Error("Current password is incorrect.");
      error.statusCode = 400;
      throw error;
    }

    user.password = await bcrypt.hash(String(newPassword).trim(), 10);
  }

  await user.save();
  return sanitizeUser(user);
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

async function requestPasswordReset(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Return same response shape for both found/not-found to avoid user enumeration.
  if (!user) {
    return {
      success: true,
      message: "If this email exists, reset instructions have been generated.",
    };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  user.resetPasswordTokenHash = hashResetToken(resetToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const response = {
    success: true,
    message: "If this email exists, reset instructions have been generated.",
  };

  if (process.env.NODE_ENV !== "production") {
    response.devResetToken = resetToken;
    response.devTokenExpiresAt = user.resetPasswordExpiresAt;
  }

  return response;
}

async function resetPassword({ token, newPassword }) {
  const resetPasswordTokenHash = hashResetToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });
  if (!user) {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(String(newPassword).trim(), 10);
  user.resetPasswordTokenHash = "";
  user.resetPasswordExpiresAt = null;
  await user.save();
}

async function deleteAccount(userId) {
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bookingsByUser = await Booking.find({ userId }).select("_id slotId status").session(session).lean();
      const bookingIdsByUser = bookingsByUser.map((item) => item._id);
      const activeSlotIds = bookingsByUser
        .filter((item) => ["pending", "confirmed", "completed"].includes(String(item.status || "")))
        .map((item) => item.slotId);
      if (activeSlotIds.length > 0) {
        await CourtSlot.updateMany({ _id: { $in: activeSlotIds } }, { $set: { isBooked: false } }, { session });
      }

      const ownedCourts = await Court.find({ ownerId: userId }).select("_id").session(session).lean();
      const ownedCourtIds = ownedCourts.map((item) => item._id);
      const courtBookings = ownedCourtIds.length
        ? await Booking.find({ courtId: { $in: ownedCourtIds } }).select("_id").session(session).lean()
        : [];
      const courtBookingIds = courtBookings.map((item) => item._id);
      const allBookingIdsToDelete = [...new Set([...bookingIdsByUser, ...courtBookingIds].map(String))].map((id) => new mongoose.Types.ObjectId(id));

      if (allBookingIdsToDelete.length > 0) {
        await Payment.deleteMany({ bookingId: { $in: allBookingIdsToDelete } }).session(session);
      }
      await Payment.deleteMany({ userId }).session(session);

      await Favorite.deleteMany({
        $or: [{ userId }, ...(ownedCourtIds.length ? [{ courtId: { $in: ownedCourtIds } }] : [])],
      }).session(session);

      await Notification.deleteMany({
        $or: [{ recipientId: userId }, { actorId: userId }],
      }).session(session);

      if (allBookingIdsToDelete.length > 0) {
        await Booking.deleteMany({ _id: { $in: allBookingIdsToDelete } }).session(session);
      }

      if (ownedCourtIds.length > 0) {
        await CourtSlot.deleteMany({ courtId: { $in: ownedCourtIds } }).session(session);
        await Court.deleteMany({ _id: { $in: ownedCourtIds } }).session(session);
      }

      await User.deleteOne({ _id: userId }).session(session);
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  requestPasswordReset,
  resetPassword,
};
