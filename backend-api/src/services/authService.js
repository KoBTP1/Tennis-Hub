const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { getNextSequence } = require("../utils/sequence");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.isBlocked ? "blocked" : "active",
  };
}

async function register(payload) {
  const { name, email, password, phone = "" } = payload;
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
  const { name, phone, currentPassword, newPassword } = payload || {};
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
};
