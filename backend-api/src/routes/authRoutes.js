const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { uploadAvatarImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", protect, authController.getMe);
router.patch("/me", protect, authController.updateMe);
router.delete("/me", protect, authController.deleteMe);
router.post("/me/avatar", protect, uploadAvatarImage.single("avatar"), authController.uploadMyAvatar);

module.exports = router;
