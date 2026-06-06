const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Require auth and admin role for logs querying
router.use(protect);
router.use(authorize("Admin"));

router.get("/", activityLogController.getActivityLogs);

module.exports = router;
