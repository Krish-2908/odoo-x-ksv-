const crypto = require("crypto");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const jwt = require("jsonwebtoken");
const { runValidators, validate } = require("../utils/validators");

// ── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  country: user.country,
  additionalInfo: user.additionalInfo,
});

// ── Register ─────────────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, country, additionalInfo, password } = req.body;

    // Run all field validators
    const errors = runValidators({ firstName, lastName, email, phone, role, country, password });
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: "Validation failed. Please fix the errors below.",
        errors,
      });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists.",
        errors: { email: "This email is already registered. Try logging in instead." },
      });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      country: country.trim(),
      additionalInfo: additionalInfo?.trim() || "",
      password,
    });

    // If role is Vendor, create matching Vendor profile
    if (role === "Vendor") {
      await Vendor.create({
        userId: user._id,
        companyName: `${user.firstName} ${user.lastName} Corp`,
        contactEmail: user.email,
        contactPhone: user.phone,
        status: "Pending Verification",
      });
    }

    res.status(201).json({
      success: true,
      user: publicUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Field-level validation
    const errors = {};
    const emailErr = validate.email(email);
    if (emailErr) errors.email = emailErr;
    if (!password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: "Validation failed.", errors });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        user: publicUser(user),
        token: generateToken(user._id),
      });
    } else {
      // Deliberate generic message to avoid email enumeration
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── Forgot Password ──────────────────────────────────────────────────────────

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailErr = validate.email(email);
    if (emailErr) {
      return res.status(422).json({ message: emailErr, errors: { email: emailErr } });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return 200 to avoid email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHashed = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHashed;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    // ── In production you would send an email here ──
    // For hackathon demo: return the URL in the response
    res.json({
      success: true,
      message: "Password reset link generated successfully.",
      // DEMO ONLY — remove in production:
      resetUrl,
      note: "In production, this link would be emailed. For the demo, use the resetUrl directly.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── Reset Password ───────────────────────────────────────────────────────────

// @desc    Reset password using token from email link
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is missing." });
    }

    const passwordErr = validate.password(password);
    if (passwordErr) {
      return res.status(422).json({ message: passwordErr, errors: { password: passwordErr } });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }, // must not be expired
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Your password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
