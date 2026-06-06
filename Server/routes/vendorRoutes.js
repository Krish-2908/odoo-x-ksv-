const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Procurement Officer", "Admin", "Manager"),
  vendorController.getAllVendors
);

router.get("/:id", protect, vendorController.getVendorById);
router.put("/:id", protect, vendorController.updateVendorProfile);

module.exports = router;
