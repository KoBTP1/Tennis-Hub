const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");

const uploadRoot = path.resolve(__dirname, "../../uploads/courts");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename(req, file, callback) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const uniqueName = `court-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    callback(null, uniqueName);
  },
});

function fileFilter(req, file, callback) {
  if (String(file.mimetype || "").startsWith("image/")) {
    callback(null, true);
    return;
  }
  callback(new Error("Only image files are allowed."));
}

const uploadCourtImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadCourtImage,
};
