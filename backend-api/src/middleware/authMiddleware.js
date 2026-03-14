const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    const currentRole = req.user?.role;
    if (!currentRole || !roles.includes(currentRole)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return next();
  };
}

module.exports = {
  protect,
  authorizeRoles,
};
