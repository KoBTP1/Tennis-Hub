const authService = require("../services/authService");

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, phone = "", role = "player" } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "name, email, password, confirmPassword are required." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Confirm password does not match." });
    }

    const result = await authService.register({ name, email, password, phone, role });
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

module.exports = {
  register,
  login,
  getMe,
};
