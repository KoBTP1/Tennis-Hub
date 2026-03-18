const express = require("express");
const assistantController = require("../controllers/assistantController");
const { protect } = require("../middleware/authMiddleware");
const { assistantLimiter } = require("../middleware/assistantRateLimit");

const router = express.Router();

router.use(protect);
router.use(assistantLimiter);
router.post("/ask", assistantController.postAsk);

module.exports = router;
