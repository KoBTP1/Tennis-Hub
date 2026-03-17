const express = require("express");
const adminController = require("../controllers/adminController");
const { authorizeRoles, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/users", adminController.getUsers);
router.patch("/users/:id/status", adminController.patchUserStatus);

router.get("/courts", adminController.getCourts);
router.get("/courts/:id", adminController.getCourtDetail);
router.get("/courts/:id/slots", adminController.getCourtSlots);
router.patch("/courts/:id/status", adminController.patchCourtStatus);

router.get("/reports/overview", adminController.getOverviewReport);
router.get("/reports/monthly", adminController.getMonthlyReport);

module.exports = router;
