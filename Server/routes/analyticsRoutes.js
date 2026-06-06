const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Require auth and specific internal roles for analytics endpoints
router.use(protect);
router.use(authorize("Admin", "Procurement Officer", "Manager"));

router.get("/", analyticsController.getAnalyticsStats);
router.get("/export", analyticsController.exportAnalyticsCSV);

module.exports = router;
