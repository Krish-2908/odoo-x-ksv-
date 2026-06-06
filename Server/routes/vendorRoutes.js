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

router.post(
  "/",
  protect,
  authorize("Procurement Officer", "Admin"),
  vendorController.createVendorProfile
);

router.get("/my-profile", protect, vendorController.getMyProfile);
router.get("/:id", protect, vendorController.getVendorById);
router.put("/:id", protect, vendorController.updateVendorProfile);
router.delete("/:id", protect, authorize("Admin"), vendorController.deleteVendorProfile);

module.exports = router;
