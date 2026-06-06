const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0.01, "Unit price must be positive"],
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const quotationSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    pricingDetails: {
      type: [quotationItemSchema],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "A quotation must have at least one priced item.",
      },
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    deliveryTimeline: {
      type: String,
      required: [true, "Delivery timeline is required"],
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Revised", "Selected", "Rejected"],
      default: "Submitted",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a vendor can submit only one quotation document per RFQ
// (Upsert logic will overwrite/update this document when resubmitting)
quotationSchema.index({ rfqId: 1, vendorId: 1 }, { unique: true });

module.exports = mongoose.model("Quotation", quotationSchema);
