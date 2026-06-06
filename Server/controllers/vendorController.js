const Vendor = require("../models/Vendor");

// @desc    Get all vendor profiles
// @route   GET /api/vendors
// @access  Private (Procurement Officer, Admin)
exports.getAllVendors = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    const vendors = await Vendor.find(filter)
      .populate("userId", "firstName lastName email role")
      .sort({ companyName: 1 });

    res.json({
      success: true,
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get vendor profile by ID
// @route   GET /api/vendors/:id
// @access  Private
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate(
      "userId",
      "firstName lastName email role"
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    // Permission check: Vendors can only view their own profile,
    // Procurement Officers, Admins, and Managers can view any profile.
    if (
      req.user.role === "Vendor" &&
      vendor.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this vendor profile" });
    }

    res.json({
      success: true,
      vendor,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/:id
// @access  Private (Vendor Owner, Admin)
exports.updateVendorProfile = async (req, res) => {
  try {
    const { companyName, category, gstNumber, contactEmail, contactPhone, status, rating } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    // Authorization check: Only the owner vendor user OR an admin can edit
    const isOwner = vendor.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    // Update fields
    if (companyName) vendor.companyName = companyName.trim();
    if (category) vendor.category = category.trim();
    if (gstNumber !== undefined) vendor.gstNumber = gstNumber.trim();
    if (contactEmail) vendor.contactEmail = contactEmail.trim().toLowerCase();
    if (contactPhone) vendor.contactPhone = contactPhone.trim();

    // Only Admin or Procurement Officer can update status/rating
    if (isAdmin || req.user.role === "Procurement Officer") {
      if (status) vendor.status = status;
      if (rating !== undefined) vendor.rating = rating;
    }

    await vendor.save();

    res.json({
      success: true,
      message: "Vendor profile updated successfully",
      vendor,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(422).json({
        message: "Validation failed",
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}),
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get currently logged in vendor profile
// @route   GET /api/vendors/my-profile
// @access  Private (Vendor only)
exports.getMyProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id }).populate(
      "userId",
      "firstName lastName email role"
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    res.json({
      success: true,
      vendor,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
