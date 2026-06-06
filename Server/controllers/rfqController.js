const RFQ = require("../models/RFQ");
const Vendor = require("../models/Vendor");

// Helper to validate RFQ input
const validateRFQInput = (data) => {
  const errors = {};

  if (!data.title || !data.title.trim()) {
    errors.title = "RFQ title is required.";
  }

  if (!data.deadline) {
    errors.deadline = "Deadline is required.";
  } else {
    const deadlineDate = new Date(data.deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.deadline = "Deadline must be a valid date.";
    } else if (deadlineDate <= new Date()) {
      errors.deadline = "Deadline must be a future date.";
    }
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.items = "At least one requested item is required.";
  } else {
    const itemErrors = [];
    data.items.forEach((item, index) => {
      const singleItemErrors = {};
      if (!item.productName || !item.productName.trim()) {
        singleItemErrors.productName = "Product name is required.";
      }
      if (item.quantity === undefined || item.quantity === null) {
        singleItemErrors.quantity = "Quantity is required.";
      } else if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        singleItemErrors.quantity = "Quantity must be an integer of at least 1.";
      }

      if (Object.keys(singleItemErrors).length > 0) {
        singleItemErrors.index = index;
        itemErrors.push(singleItemErrors);
      }
    });

    if (itemErrors.length > 0) {
      errors.itemDetails = itemErrors;
    }
  }

  return errors;
};

// @desc    Create a new RFQ
// @route   POST /api/rfqs
// @access  Private (Procurement Officer)
exports.createRFQ = async (req, res) => {
  try {
    const { title, description, items, deadline, assignedVendors, status } = req.body;

    // Run custom validations
    const errors = validateRFQInput({ title, items, deadline });
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: "RFQ validation failed.",
        errors,
      });
    }

    // Verify assigned vendors exist if provided
    let verifiedVendors = [];
    if (assignedVendors && Array.isArray(assignedVendors)) {
      verifiedVendors = await Vendor.find({ _id: { $in: assignedVendors } });
      if (verifiedVendors.length !== assignedVendors.length) {
        return res.status(400).json({
          message: "One or more assigned vendors are invalid.",
        });
      }
    }

    const rfq = await RFQ.create({
      title: title.trim(),
      description: description?.trim() || "",
      items,
      deadline: new Date(deadline),
      assignedVendors: verifiedVendors.map((v) => v._id),
      status: status || "Draft",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      rfq,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all RFQs (filtered by role)
// @route   GET /api/rfqs
// @access  Private
exports.getRFQs = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Role-based filtering
    if (req.user.role === "Vendor") {
      // Find this vendor's profile
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor) {
        return res.json({ success: true, count: 0, rfqs: [] });
      }

      // Vendor can only see RFQs they are assigned to, and which are NOT drafts
      filter.assignedVendors = vendor._id;
      filter.status = { $ne: "Draft" };
      if (status) {
        // If they specifically filter by Draft, return empty list
        if (status === "Draft") {
          return res.json({ success: true, count: 0, rfqs: [] });
        }
        filter.status = status;
      }
    }

    const rfqs = await RFQ.find(filter)
      .populate("createdBy", "firstName lastName email")
      .populate("assignedVendors", "companyName category contactEmail contactPhone status rating")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rfqs.length,
      rfqs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single RFQ by ID
// @route   GET /api/rfqs/:id
// @access  Private
exports.getRFQById = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("assignedVendors", "companyName category contactEmail contactPhone status rating");

    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    // Role-based authorization
    if (req.user.role === "Vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor) {
        return res.status(403).json({ message: "Not authorized to view this RFQ (no vendor profile)" });
      }

      // Is vendor assigned? Is it a draft?
      const isAssigned = rfq.assignedVendors.some(
        (v) => v._id.toString() === vendor._id.toString()
      );

      if (!isAssigned || rfq.status === "Draft") {
        return res.status(403).json({ message: "Not authorized to view this RFQ" });
      }
    }

    res.json({
      success: true,
      rfq,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update RFQ details/status
// @route   PUT /api/rfqs/:id
// @access  Private (Procurement Officer)
exports.updateRFQ = async (req, res) => {
  try {
    const { title, description, items, deadline, assignedVendors, status } = req.body;

    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    // Only allow update if user is Procurement Officer
    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Not authorized to update RFQs." });
    }

    // Run validations if those fields are sent
    const validationData = {
      title: title !== undefined ? title : rfq.title,
      items: items !== undefined ? items : rfq.items,
      deadline: deadline !== undefined ? deadline : rfq.deadline,
    };

    // Only validate deadline if it's being updated
    if (deadline !== undefined) {
      const errors = validateRFQInput(validationData);
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({
          message: "RFQ validation failed.",
          errors,
        });
      }
    }

    // Verify assigned vendors if updated
    if (assignedVendors !== undefined && Array.isArray(assignedVendors)) {
      const verifiedVendors = await Vendor.find({ _id: { $in: assignedVendors } });
      if (verifiedVendors.length !== assignedVendors.length) {
        return res.status(400).json({
          message: "One or more assigned vendors are invalid.",
        });
      }
      rfq.assignedVendors = assignedVendors;
    }

    // Update other fields
    if (title !== undefined) rfq.title = title.trim();
    if (description !== undefined) rfq.description = description.trim();
    if (items !== undefined) rfq.items = items;
    if (deadline !== undefined) rfq.deadline = new Date(deadline);
    if (status !== undefined) rfq.status = status;

    await rfq.save();

    res.json({
      success: true,
      message: "RFQ updated successfully",
      rfq,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete RFQ (Draft only)
// @route   DELETE /api/rfqs/:id
// @access  Private (Procurement Officer)
exports.deleteRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    // Only allow delete if user is Procurement Officer
    if (req.user.role !== "Procurement Officer") {
      return res.status(403).json({ message: "Not authorized to delete RFQs." });
    }

    // Only draft RFQs can be deleted
    if (rfq.status !== "Draft") {
      return res.status(400).json({
        message: `Cannot delete an RFQ in '${rfq.status}' status. Only 'Draft' RFQs can be deleted.`,
      });
    }

    await rfq.deleteOne();

    res.json({
      success: true,
      message: "RFQ deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
