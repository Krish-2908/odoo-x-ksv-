const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All analytics routes require auth
router.use(protect);

// Vendor self-analytics — accessible only to Vendors
router.get("/vendor-self", authorize("Vendor"), analyticsController.getVendorSelfAnalytics);

// Internal-role-only analytics
router.get("/", authorize("Admin", "Procurement Officer", "Manager"), analyticsController.getAnalyticsStats);
router.get("/export", authorize("Admin", "Procurement Officer", "Manager"), analyticsController.exportAnalyticsCSV);

module.exports = router;
