const express = require("express");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/my", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.patchRead);
router.patch("/read-all", notificationController.patchReadAll);

module.exports = router;
