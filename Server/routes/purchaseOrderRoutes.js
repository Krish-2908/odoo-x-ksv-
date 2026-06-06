const express = require("express");
const router = express.Router();
const poController = require("../controllers/purchaseOrderController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All PO routes require token authentication
router.use(protect);

router
  .route("/")
  .post(authorize("Procurement Officer"), poController.createPurchaseOrder)
  .get(poController.getPurchaseOrders);

router.route("/:id").get(poController.getPurchaseOrderById);

router.put(
  "/:id/status",
  authorize("Procurement Officer"),
  poController.updatePOStatus
);

router.post(
  "/:id/razorpay-order",
  authorize("Procurement Officer"),
  poController.createRazorpayOrder
);

router.post(
  "/:id/verify-payment",
  authorize("Procurement Officer"),
  poController.verifyPayment
);

module.exports = router;
