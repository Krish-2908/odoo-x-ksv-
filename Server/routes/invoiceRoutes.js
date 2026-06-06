const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.route("/").get(invoiceController.getInvoices);
router.route("/:id").get(invoiceController.getInvoiceById);

router.post(
  "/:id/razorpay-order",
  authorize("Procurement Officer"),
  invoiceController.createRazorpayOrderForInvoice
);

router.post(
  "/:id/verify-payment",
  authorize("Procurement Officer"),
  invoiceController.verifyInvoicePayment
);

router.post(
  "/:id/send-email",
  authorize("Procurement Officer"),
  invoiceController.sendInvoiceEmail
);

module.exports = router;
