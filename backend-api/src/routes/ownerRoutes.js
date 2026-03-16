const express = require("express");
const ownerController = require("../controllers/ownerController");
const { authorizeRoles, protect } = require("../middleware/authMiddleware");
const { uploadCourtImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("owner"));

router.get("/dashboard", ownerController.getDashboard);

router.get("/courts", ownerController.getCourts);
router.post("/courts", ownerController.createCourt);
router.patch("/courts/:id", ownerController.patchCourt);
router.delete("/courts/:id", ownerController.deleteCourt);

router.get("/courts/:id/slots", ownerController.getSlots);
router.post("/courts/:id/slots", ownerController.createSlot);
router.patch("/slots/:id", ownerController.patchSlot);
router.delete("/slots/:id", ownerController.deleteSlot);

router.get("/bookings", ownerController.getBookings);
router.patch("/bookings/:id/status", ownerController.patchBookingStatus);
router.post("/uploads/image", uploadCourtImage.single("image"), ownerController.uploadImage);

module.exports = router;
