const User = require("../models/User");
const Vendor = require("../models/Vendor");
const { runValidators } = require("../utils/validators");
const { logActivity } = require("../utils/logger");

// @desc    Get all users list
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create new user account
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, country, password } = req.body;

    const errors = runValidators({ firstName, lastName, email, phone, role, country, password });
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: "Validation failed. Please fix the errors below.",
        errors,
      });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists.",
        errors: { email: "This email is already registered." },
      });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      country: country.trim(),
      password,
    });

    // Spawn Vendor profile automatically if role is Vendor
    if (role === "Vendor") {
      await Vendor.create({
        userId: user._id,
        companyName: `${user.firstName} ${user.lastName} Corp`,
        contactEmail: user.email,
        contactPhone: user.phone,
        status: "Pending Verification",
      });
    }

    await logActivity(
      req.user._id,
      "USER_CREATED",
      `Admin created user account for ${user.firstName} ${user.lastName} (${role})`
    );

    res.status(201).json({
      success: true,
      message: "User account created successfully.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        country: user.country,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, country, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (phone) user.phone = phone.trim();
    if (country) user.country = country.trim();
    
    const oldRole = user.role;
    if (role && ["Admin", "Procurement Officer", "Vendor", "Manager"].includes(role)) {
      user.role = role;
    }

    if (password) {
      user.password = password;
    }

    await user.save();

    // Spawn vendor profile if role was switched to Vendor
    if (user.role === "Vendor" && oldRole !== "Vendor") {
      const existingProfile = await Vendor.findOne({ userId: user._id });
      if (!existingProfile) {
        await Vendor.create({
          userId: user._id,
          companyName: `${user.firstName} ${user.lastName} Corp`,
          contactEmail: user.email,
          contactPhone: user.phone,
          status: "Pending Verification",
        });
      }
    }

    await logActivity(
      req.user._id,
      "USER_UPDATED",
      `Admin updated user details for ${user.firstName} ${user.lastName}`
    );

    res.json({
      success: true,
      message: "User account updated successfully.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        country: user.country,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete user record
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const name = `${user.firstName} ${user.lastName}`;
    await User.findByIdAndDelete(req.params.id);

    if (user.role === "Vendor") {
      await Vendor.findOneAndDelete({ userId: user._id });
    }

    await logActivity(
      req.user._id,
      "USER_DELETED",
      `Admin deleted user account: ${name}`
    );

    res.json({
      success: true,
      message: "User account and associated vendor profiles deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
