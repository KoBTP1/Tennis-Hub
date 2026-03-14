const express = require("express");
const courtController = require("../controllers/courtController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// protect will enforce auth based on JWT
router.get("/", protect, courtController.getCourts);
router.get("/:id", protect, courtController.getCourtDetails);
router.get("/:id/slots", protect, courtController.getCourtSlots);

module.exports = router;
