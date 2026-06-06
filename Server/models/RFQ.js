const mongoose = require("mongoose");

const rfqItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  specs: {
    type: String,
    default: "",
    trim: true,
  },
});

const rfqSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "RFQ title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    items: {
      type: [rfqItemSchema],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "An RFQ must have at least one item.",
      },
    },
    attachments: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
      required: [true, "RFQ deadline date is required"],
      validate: {
        validator: function (d) {
          // Allow deadline to be updated/kept if in the past for closed RFQs,
          // but for new ones (or updating) let's validate it is in the future.
          // Since Mongoose validates on save, let's check it's in the future on creation.
          // Wait, is it better to only validate in controller? Yes, because if we view/resave an old RFQ, the date will be in the past.
          // Let's just do standard Date.
          return d instanceof Date && !isNaN(d);
        },
        message: "Deadline must be a valid date.",
      },
    },
    assignedVendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Open", "Closed", "Under Review", "Completed"],
      default: "Draft",
    },
    selectedQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Rejected"],
      default: "Draft",
    },
    approvalTimeline: [
      {
        action: {
          type: String,
        },
        actionBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        remarks: {
          type: String,
          default: "",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RFQ", rfqSchema);
