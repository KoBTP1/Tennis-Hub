const authService = require("../services/authService");
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(email) {
  const normalized = String(email || "").trim();
  // Tight enough for API validation while keeping common valid emails compatible.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
}

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, phone = "" } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "name, email, password, confirmPassword are required." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Confirm password does not match." });
    }

    const normalizedPhone = normalizePhone(phone);
    if (phone !== undefined && !isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: "Phone must be 9-15 digits and may start with '+'." });
    }

    const result = await authService.register({ name, email, password, phone: normalizedPhone, role: "player" });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const result = await authService.login({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.userId);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

function normalizePhone(phone) {
  return String(phone || "").trim().replace(/[\s-]/g, "");
}

function isValidPhone(phone) {
  if (!phone) {
    return true;
  }
  return /^\+?\d{9,15}$/.test(phone);
}

async function updateMe(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { name, phone, currentPassword, newPassword } = req.body || {};

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    const normalizedPhone = normalizePhone(phone);
    if (phone !== undefined && !isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: "Phone must be 9-15 digits and may start with '+'." });
    }

    if (newPassword !== undefined) {
      if (!String(newPassword).trim()) {
        return res.status(400).json({ message: "New password cannot be empty." });
      }
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password." });
      }
      if (String(newPassword).trim().length < MIN_PASSWORD_LENGTH) {
        return res
          .status(400)
          .json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      }
    }

    const user = await authService.updateProfile(userId, {
      name,
      phone: phone === undefined ? undefined : normalizedPhone,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    const result = await authService.requestPasswordReset(email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword, confirmPassword } = req.body || {};
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "token, newPassword and confirmPassword are required." });
    }
    if (String(newPassword).trim().length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Confirm password does not match." });
    }

    await authService.resetPassword({ token, newPassword });
    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
};
