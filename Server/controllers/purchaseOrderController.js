const PurchaseOrder = require("../models/PurchaseOrder");
const RFQ = require("../models/RFQ");
const Quotation = require("../models/Quotation");
const Vendor = require("../models/Vendor");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Invoice = require("../models/Invoice");
const { logActivity } = require("../utils/logger");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID?.trim() || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET?.trim() || "",
});

const USD_TO_INR = 83; // Conversion rate for Razorpay integration

// @desc    Generate Purchase Order from Approved RFQ Selection
// @route   POST /api/purchase-orders
// @access  Private (Procurement Officer)
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { rfqId } = req.body;
    if (!rfqId) {
      return res.status(400).json({ message: "RFQ ID is required." });
    }

    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Only Procurement Officers can generate Purchase Orders." });
    }

    // 1. Fetch RFQ
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found." });
    }

    // 2. Validate RFQ approval status
    if (rfq.status !== "Under Review" || rfq.approvalStatus !== "Approved") {
      return res.status(400).json({
        message: `Cannot generate PO. RFQ approval state is currently '${rfq.approvalStatus}' (needs to be 'Approved').`,
      });
    }

    // 3. Prevent duplicate PO generation for the same RFQ
    const existingPO = await PurchaseOrder.findOne({ rfqId });
    if (existingPO) {
      return res.status(400).json({
        message: "A Purchase Order has already been generated for this RFQ.",
        purchaseOrder: existingPO,
      });
    }

    // 4. Fetch selected quotation
    if (!rfq.selectedQuotation) {
      return res.status(400).json({ message: "No selected quotation found on this RFQ." });
    }

    const quotation = await Quotation.findById(rfq.selectedQuotation);
    if (!quotation) {
      return res.status(404).json({ message: "Selected quotation not found." });
    }

    // 5. Generate sequential PO number
    const lastPO = await PurchaseOrder.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastPO && lastPO.poNumber) {
      const parts = lastPO.poNumber.split("-");
      const lastCounter = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastCounter)) {
        nextNum = lastCounter + 1;
      }
    }
    const year = new Date().getFullYear();
    const poNumber = `PO-${year}-${String(nextNum).padStart(4, "0")}`;

    // 6. Map items snapshot
    const poItems = quotation.pricingDetails.map((item) => {
      // Find corresponding quantity from RFQ items
      const rfqItem = rfq.items.find(
        (ri) => ri._id.toString() === item.productId.toString()
      );
      const qty = rfqItem ? rfqItem.quantity : 1;
      return {
        productName: item.productName,
        quantity: qty,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      };
    });

    // 7. Calculate tax and totals (18% GST standard)
    const subtotal = Number(quotation.grandTotal.toFixed(2));
    const taxRate = 18;
    const taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2));
    const grandTotal = Number((subtotal + taxAmount).toFixed(2));

    // 8. Create Purchase Order
    const purchaseOrder = await PurchaseOrder.create({
      poNumber,
      rfqId: rfq._id,
      quotationId: quotation._id,
      vendorId: quotation.vendorId,
      items: poItems,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      status: "Issued",
      createdBy: req.user._id,
    });

    await logActivity(
      req.user._id,
      "PO_GENERATED",
      `Generated Purchase Order ${purchaseOrder.poNumber} for RFQ: "${rfq.title}"`
    );

    // 8.5. Automatically create Unpaid Invoice for the Purchase Order
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    let nextInvNum = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split("-");
      const lastCounter = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastCounter)) {
        nextInvNum = lastCounter + 1;
      }
    }
    const invNumber = `INV-${year}-${String(nextInvNum).padStart(4, "0")}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days due date

    await Invoice.create({
      invoiceNumber: invNumber,
      purchaseOrderId: purchaseOrder._id,
      rfqId: rfq._id,
      quotationId: quotation._id,
      vendorId: quotation.vendorId,
      items: poItems,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      status: "Unpaid",
      dueDate,
    });

    // 9. Update RFQ status to Completed
    rfq.status = "Completed";
    await rfq.save();

    res.status(201).json({
      success: true,
      message: "Purchase Order and tax details generated successfully.",
      purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all Purchase Orders (filtered by role)
// @route   GET /api/purchase-orders
// @access  Private
exports.getPurchaseOrders = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "Vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor) {
        return res.json({ success: true, count: 0, purchaseOrders: [] });
      }
      filter.vendorId = vendor._id;
    }

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate("rfqId", "title description deadline status")
      .populate("vendorId", "companyName category gstNumber contactEmail contactPhone rating")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: purchaseOrders.length,
      purchaseOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get details of a single Purchase Order by ID
// @route   GET /api/purchase-orders/:id
// @access  Private
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("rfqId", "title description deadline status")
      .populate("vendorId", "companyName category gstNumber contactEmail contactPhone rating")
      .populate("createdBy", "firstName lastName email");

    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase Order not found." });
    }

    // Role-based visibility check
    if (req.user.role === "Vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor || purchaseOrder.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Not authorized to view this Purchase Order." });
      }
    }

    res.json({
      success: true,
      purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create Razorpay Order for Purchase Order Payment
// @route   POST /api/purchase-orders/:id/razorpay-order
// @access  Private (Procurement Officer)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate("vendorId", "companyName");
    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found." });
    }

    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Only Procurement Officers can initiate payments." });
    }

    if (po.status === "Paid") {
      return res.status(400).json({ message: "This Purchase Order has already been paid." });
    }

    // Convert PO USD amount to INR paise (1 USD = 83 INR)
    const amountInINR = po.grandTotal * USD_TO_INR;
    const amountInPaise = Math.round(amountInINR * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: po.poNumber,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save Razorpay Order ID to database
    po.razorpayOrderId = razorpayOrder.id;
    await po.save();

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID?.trim(),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id,
      poNumber: po.poNumber,
      vendorName: po.vendorId.companyName,
      description: `Payment for Purchase Order ${po.poNumber}`,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
      rawError: error,
    });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/purchase-orders/:id/verify-payment
// @access  Private (Procurement Officer)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment verification details." });
    }

    // Validate Signature HMAC-SHA256
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET?.trim() || "");
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found." });
    }

    // Update PO details
    po.status = "Paid";
    po.razorpayPaymentId = razorpay_payment_id;
    po.razorpaySignature = razorpay_signature;
    await po.save();

    res.json({
      success: true,
      message: "Payment verified successfully.",
      purchaseOrder: po,
    });
  } catch (error) {
    res.status(500).json({ message: "Verification server error", error: error.message });
  }
};

// @desc    Update Purchase Order status manually (e.g. cancel)
// @route   PUT /api/purchase-orders/:id/status
// @access  Private (Procurement Officer)
exports.updatePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["Issued", "Paid", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid purchase order status." });
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found." });
    }

    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Only Procurement Officers can update PO statuses." });
    }

    po.status = status;
    await po.save();

    res.json({
      success: true,
      message: `Purchase Order status updated to '${status}'.`,
      purchaseOrder: po,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
