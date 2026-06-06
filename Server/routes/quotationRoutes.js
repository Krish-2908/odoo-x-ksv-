const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All quotation endpoints require authentication
router.use(protect);

router
  .route("/")
  .post(authorize("Vendor"), quotationController.submitQuotation)
  .get(authorize("Vendor"), quotationController.getMyQuotations);

router.get(
  "/rfq/:rfqId",
  authorize("Procurement Officer", "Admin", "Manager"),
  quotationController.getRFQQuotations
);

router.get("/:id", quotationController.getQuotationById);

module.exports = router;
