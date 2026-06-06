const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    category: {
      type: String,
      default: "Unassigned",
      trim: true,
    },
    gstNumber: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          // If GST is provided, validate it with standard GSTIN regex
          if (!v) return true;
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid GST number!`,
      },
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Pending Verification", "Suspended"],
      default: "Pending Verification",
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vendor", vendorSchema);
