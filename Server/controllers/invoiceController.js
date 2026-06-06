const Invoice = require("../models/Invoice");
const PurchaseOrder = require("../models/PurchaseOrder");
const Vendor = require("../models/Vendor");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { logActivity } = require("../utils/logger");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID?.trim() || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET?.trim() || "",
});

const USD_TO_INR = 83; // Standard conversion rate

// @desc    Get all Invoices (filtered by role)
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "Vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor) {
        return res.json({ success: true, count: 0, invoices: [] });
      }
      filter.vendorId = vendor._id;
    }

    const invoices = await Invoice.find(filter)
      .populate("purchaseOrderId", "poNumber status")
      .populate("rfqId", "title status")
      .populate("vendorId", "companyName category gstNumber contactEmail contactPhone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get Invoice details by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("purchaseOrderId")
      .populate("rfqId", "title description deadline status")
      .populate("vendorId", "companyName category gstNumber contactEmail contactPhone rating");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    // Security check: Vendors can only view their own invoices
    if (req.user.role === "Vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor || invoice.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Not authorized to view this invoice." });
      }
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create Razorpay Order for Invoice payment
// @route   POST /api/invoices/:id/razorpay-order
// @access  Private (Procurement Officer)
exports.createRazorpayOrderForInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("vendorId", "companyName");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Only Procurement Officers can initiate payments." });
    }

    if (invoice.status === "Paid") {
      return res.status(400).json({ message: "This Invoice has already been paid." });
    }

    // Convert Invoice USD amount to INR paise
    const amountInINR = invoice.grandTotal * USD_TO_INR;
    const amountInPaise = Math.round(amountInINR * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: invoice.invoiceNumber,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    invoice.razorpayOrderId = razorpayOrder.id;
    await invoice.save();

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID?.trim(),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id,
      invoiceNumber: invoice.invoiceNumber,
      vendorName: invoice.vendorId.companyName,
      description: `Payment for Tax Invoice ${invoice.invoiceNumber}`,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/invoices/:id/verify-payment
// @access  Private (Procurement Officer)
exports.verifyInvoicePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment verification details." });
    }

    // Validate Signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET?.trim() || "");
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    // Update Invoice status
    invoice.status = "Paid";
    invoice.razorpayPaymentId = razorpay_payment_id;
    invoice.razorpaySignature = razorpay_signature;
    await invoice.save();

    // Sync status to the linked Purchase Order
    const po = await PurchaseOrder.findById(invoice.purchaseOrderId);
    if (po) {
      po.status = "Paid";
      po.razorpayOrderId = razorpay_order_id;
      po.razorpayPaymentId = razorpay_payment_id;
      po.razorpaySignature = razorpay_signature;
      await po.save();
    }

    await logActivity(
      req.user._id,
      "INVOICE_PAID",
      `Cleared Invoice ${invoice.invoiceNumber} (Grand Total: $${invoice.grandTotal}) via Razorpay`
    );

    res.json({
      success: true,
      message: "Invoice payment verified and recorded successfully.",
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: "Verification server error", error: error.message });
  }
};

// @desc    Mock send Invoice email to Vendor
// @route   POST /api/invoices/:id/send-email
// @access  Private (Procurement Officer)
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("vendorId")
      .populate("purchaseOrderId");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Only Procurement Officers can email invoices." });
    }

    // Mock Email sending log
    console.log("\n================ MOCK EMAIL INBOX ================");
    console.log(`To: ${invoice.vendorId.contactEmail}`);
    console.log(`Subject: [Invoice bridge] Invoice Billed for PO ${invoice.purchaseOrderId.poNumber}`);
    console.log("--------------------------------------------------");
    console.log(`Dear ${invoice.vendorId.companyName},`);
    console.log(`We have generated Tax Invoice ${invoice.invoiceNumber} for your contract.`);
    console.log(`Total Billed: $${invoice.grandTotal.toFixed(2)} (including 18% GST)`);
    console.log(`Payment Status: ${invoice.status}`);
    console.log(`Due Date: ${new Date(invoice.dueDate).toDateString()}`);
    console.log("\nPlease access your Vendor Portal to print/download the document.");
    console.log("==================================================\n");

    invoice.emailSent = true;
    invoice.emailSentAt = new Date();
    await invoice.save();

    await logActivity(
      req.user._id,
      "INVOICE_EMAILED",
      `Emailed Invoice ${invoice.invoiceNumber} summary to vendor contact ${invoice.vendorId.contactEmail}`
    );

    res.json({
      success: true,
      message: `Invoice email successfully dispatched to ${invoice.vendorId.contactEmail}`,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: "Email dispatch failed", error: error.message });
  }
};
