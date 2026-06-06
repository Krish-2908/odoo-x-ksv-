const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Require auth and allowed roles for logs querying
router.use(protect);
router.use(authorize("Admin", "Procurement Officer", "Manager"));

router.get("/", activityLogController.getActivityLogs);

module.exports = router;
