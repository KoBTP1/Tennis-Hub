const express = require("express");
const assistantController = require("../controllers/assistantController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/ask", assistantController.postAsk);

module.exports = router;
