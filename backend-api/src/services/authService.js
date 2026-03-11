const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

async function getNextUserId() {
  const latestUser = await User.findOne({}).sort({ id: -1 }).select("id");
  return latestUser ? latestUser.id + 1 : 1;
}

async function register(payload) {
  const { name, email, password, phone = "", role = "player" } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const nextId = await getNextUserId();

  const createdUser = await User.create({
    id: nextId,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim(),
    role,
  });

  const token = generateToken(createdUser);
  return {
    token,
    user: sanitizeUser(createdUser),
  };
}

async function login(payload) {
  const { email, password } = payload;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
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

module.exports = {
  register,
  login,
  getProfile,
};
