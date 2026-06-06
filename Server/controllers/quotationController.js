const Quotation = require("../models/Quotation");
const RFQ = require("../models/RFQ");
const Vendor = require("../models/Vendor");
const { logActivity } = require("../utils/logger");

// @desc    Submit or update a quotation (Vendor only)
// @route   POST /api/quotations
// @access  Private (Vendor)
exports.submitQuotation = async (req, res) => {
  try {
    const { rfqId, pricingDetails, deliveryTimeline, notes } = req.body;

    // 1. Get vendor profile linked to logged in user
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(400).json({ message: "Vendor profile not found. Complete profile registration." });
    }

    if (vendor.status === "Suspended") {
      return res.status(403).json({ message: "Your account is suspended. Submissions blocked." });
    }

    // 2. Validate RFQ exists, is Open, and deadline has not passed
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    if (rfq.status !== "Open") {
      return res.status(400).json({ message: `Cannot submit bid. RFQ is currently in '${rfq.status}' status.` });
    }

    if (new Date(rfq.deadline) <= new Date()) {
      return res.status(400).json({ message: "RFQ deadline has expired. Submissions are closed." });
    }

    // 3. Validate vendor is assigned to the RFQ
    const isAssigned = rfq.assignedVendors.some(
      (vId) => vId.toString() === vendor._id.toString()
    );
    if (!isAssigned) {
      return res.status(403).json({ message: "Not authorized. You are not assigned to this RFQ." });
    }

    // 4. Validate pricing details align with RFQ items
    if (!pricingDetails || !Array.isArray(pricingDetails) || pricingDetails.length === 0) {
      return res.status(422).json({ message: "Pricing details are required for all line items." });
    }

    let calculatedGrandTotal = 0;
    const formattedPricingDetails = [];

    for (const rfqItem of rfq.items) {
      const bid = pricingDetails.find(
        (p) => p.productId && p.productId.toString() === rfqItem._id.toString()
      );

      if (!bid || bid.unitPrice === undefined || bid.unitPrice === null) {
        return res.status(422).json({
          message: `Missing pricing details for item: ${rfqItem.productName}`,
        });
      }

      const unitPrice = parseFloat(bid.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0.01) {
        return res.status(422).json({
          message: `Unit price for '${rfqItem.productName}' must be a positive number.`,
        });
      }

      const lineTotal = Number((unitPrice * rfqItem.quantity).toFixed(2));
      calculatedGrandTotal += lineTotal;

      formattedPricingDetails.push({
        productId: rfqItem._id,
        productName: rfqItem.productName,
        unitPrice,
        totalPrice: lineTotal,
      });
    }

    if (!deliveryTimeline || !deliveryTimeline.trim()) {
      return res.status(422).json({ message: "Delivery timeline is required." });
    }

    calculatedGrandTotal = Number(calculatedGrandTotal.toFixed(2));

    // 5. Look for existing quotation to support update/resubmit
    let quotation = await Quotation.findOne({ rfqId: rfq._id, vendorId: vendor._id });

    if (quotation) {
      // Update existing quotation
      quotation.pricingDetails = formattedPricingDetails;
      quotation.grandTotal = calculatedGrandTotal;
      quotation.deliveryTimeline = deliveryTimeline.trim();
      quotation.notes = notes?.trim() || "";
      quotation.status = "Revised";
      await quotation.save();
      await logActivity(req.user._id, "QUOTE_UPDATED", `Vendor updated quotation $${quotation.grandTotal} for RFQ: "${rfq.title}"`);
    } else {
      // Create new quotation
      quotation = await Quotation.create({
        rfqId: rfq._id,
        vendorId: vendor._id,
        pricingDetails: formattedPricingDetails,
        grandTotal: calculatedGrandTotal,
        deliveryTimeline: deliveryTimeline.trim(),
        notes: notes?.trim() || "",
        status: "Submitted",
      });
      await logActivity(req.user._id, "QUOTE_SUBMITTED", `Vendor submitted quotation $${quotation.grandTotal} for RFQ: "${rfq.title}"`);
    }

    res.status(200).json({
      success: true,
      message: "Quotation submitted successfully.",
      quotation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get quotations submitted by logged-in vendor
// @route   GET /api/quotations
// @access  Private (Vendor)
exports.getMyQuotations = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(400).json({ message: "Vendor profile not found." });
    }

    const { rfqId } = req.query;
    const filter = { vendorId: vendor._id };
    if (rfqId) {
      filter.rfqId = rfqId;
    }

    const quotations = await Quotation.find(filter)
      .populate("rfqId", "title description deadline status createdBy")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: quotations.length,
      quotations,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all quotations submitted for an RFQ
// @route   GET /api/quotations/rfq/:rfqId
// @access  Private (Procurement Officer, Admin, Manager)
exports.getRFQQuotations = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.rfqId);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    const quotations = await Quotation.find({ rfqId: req.params.rfqId })
      .populate("vendorId", "companyName category gstNumber contactEmail contactPhone status rating")
      .sort({ grandTotal: 1 }); // Sorted by lowest bid first!

    res.json({
      success: true,
      count: quotations.length,
      quotations,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get details of a single quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate("vendorId", "companyName category gstNumber contactEmail contactPhone status rating")
      .populate("rfqId", "title description deadline status");

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Role check: Vendor must own the quotation to view it
    if (req.user.role === "Vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor || quotation.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Not authorized to view this quotation." });
      }
    }

    res.json({
      success: true,
      quotation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get ALL quotations (Procurement Officer / Admin view)
// @route   GET /api/quotations/all
// @access  Private (Procurement Officer, Admin)
exports.getAllQuotations = async (req, res) => {
  try {
    const { status, rfqId, vendorId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (rfqId) filter.rfqId = rfqId;
    if (vendorId) filter.vendorId = vendorId;

    const quotations = await Quotation.find(filter)
      .populate("vendorId", "companyName category contactEmail rating status")
      .populate("rfqId", "title deadline status createdBy")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quotations.length, quotations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
