const express = require("express");
const courtController = require("../controllers/courtController");
const { authorizeRoles, protect } = require("../middleware/authMiddleware");

const router = express.Router();

// protect will enforce auth based on JWT
router.get("/", protect, courtController.getCourts);
router.get("/:id", protect, courtController.getCourtDetails);
router.get("/:id/slots", protect, courtController.getCourtSlots);
router.post("/:id/favorite", protect, authorizeRoles("player"), courtController.postToggleFavorite);

module.exports = router;
