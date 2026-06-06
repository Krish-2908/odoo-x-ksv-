const User = require("../models/User");
const Vendor = require("../models/Vendor");
const RFQ = require("../models/RFQ");
const Quotation = require("../models/Quotation");
const PurchaseOrder = require("../models/PurchaseOrder");
const Invoice = require("../models/Invoice");

// @desc    Get aggregated spending and vendor compliance metrics
// @route   GET /api/analytics
// @access  Private (Admin, Procurement Officer, Manager)
exports.getAnalyticsStats = async (req, res) => {
  try {
    // 1. General counts
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const totalRFQs = await RFQ.countDocuments();
    const openRFQs = await RFQ.countDocuments({ status: "Open" });
    const reviewRFQs = await RFQ.countDocuments({ status: "Under Review" });
    const completedRFQs = await RFQ.countDocuments({ status: "Completed" });
    
    const paidInvoicesCount = await Invoice.countDocuments({ status: "Paid" });
    const unpaidInvoicesCount = await Invoice.countDocuments({ status: "Unpaid" });

    // 2. Spend analytics (Paid Invoices sum)
    const paidInvoicesSumAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalSpendINR = paidInvoicesSumAgg[0]?.total || 0;

    // 3. Spend by Month (Paid Invoices grouped by month)
    const monthlySpendAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$grandTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const spendByMonth = monthlySpendAgg.map((item) => ({
      month: item._id,
      amount: Number(item.total.toFixed(2)),
    }));

    // 4. Spend by Vendor Category
    const vendorSpendAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: "$vendorId",
          total: { $sum: "$grandTotal" },
        },
      },
    ]);

    const categoryTotals = {};
    for (const item of vendorSpendAgg) {
      if (item._id) {
        const vendor = await Vendor.findById(item._id);
        const cat = vendor ? vendor.category || "General Supply" : "General Supply";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.total;
      }
    }
    const spendByCategory = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));

    // 5. Vendor Performance Metrics
    const vendors = await Vendor.find();
    const vendorPerformance = [];
    for (const v of vendors) {
      const totalQuotes = await Quotation.countDocuments({ vendorId: v._id });
      const wonQuotes = await Quotation.countDocuments({ vendorId: v._id, status: "Selected" });
      const winRate = totalQuotes > 0 ? Math.round((wonQuotes / totalQuotes) * 100) : 0;
      const poCount = await PurchaseOrder.countDocuments({ vendorId: v._id });
      const paidPoCount = await PurchaseOrder.countDocuments({ vendorId: v._id, status: "Paid" });

      vendorPerformance.push({
        id: v._id,
        companyName: v.companyName,
        category: v.category || "General",
        rating: v.rating || 5.0,
        totalQuotes,
        wonQuotes,
        winRate,
        totalPOs: poCount,
        paidPOs: paidPoCount,
      });
    }

    // 6. CYCLE TIME & PERFORMANCE Cycle calculations (RFQ to Payment Cycle)
    const completedPOs = await PurchaseOrder.find({ status: "Paid" }).populate("rfqId");
    let totalRfqToPaidTime = 0;
    let completedPoCount = 0;

    for (const po of completedPOs) {
      if (po.rfqId) {
        const rfq = po.rfqId;
        const rfqCreated = new Date(rfq.createdAt);
        // Find matching paid invoice
        const invoice = await Invoice.findOne({ purchaseOrderId: po._id, status: "Paid" });
        if (invoice) {
          const invoicePaid = new Date(invoice.updatedAt);
          const daysDiff = (invoicePaid - rfqCreated) / (1000 * 60 * 60 * 24);
          if (daysDiff > 0) {
            totalRfqToPaidTime += daysDiff;
            completedPoCount++;
          }
        }
      }
    }
    const avgCycleDays = completedPoCount > 0 ? Number((totalRfqToPaidTime / completedPoCount).toFixed(1)) : 0;

    // 7. FINANCIAL SAVINGS (Selected quote vs average of other quotes)
    const selectedRFQs = await RFQ.find({ selectedQuotation: { $ne: null } });
    let totalSavingsINR = 0;
    for (const r of selectedRFQs) {
      const allQuotes = await Quotation.find({ rfqId: r._id });
      if (allQuotes.length > 1) {
        const winningQuote = allQuotes.find(q => q._id.toString() === r.selectedQuotation.toString());
        if (winningQuote) {
          const otherQuotes = allQuotes.filter(q => q._id.toString() !== r.selectedQuotation.toString());
          const sumOther = otherQuotes.reduce((sum, q) => sum + q.grandTotal, 0);
          const avgOther = sumOther / otherQuotes.length;
          const savings = avgOther - winningQuote.grandTotal;
          if (savings > 0) {
            totalSavingsINR += savings;
          }
        }
      }
    }

    // 8. UNPAID INVOICES AGING ANALYSIS
    const unpaidInvoices = await Invoice.find({ status: "Unpaid" });
    let ageGroup1 = 0; // 0-7 days
    let ageGroup2 = 0; // 8-30 days
    let ageGroup3 = 0; // 30+ days
    const now = new Date();
    for (const inv of unpaidInvoices) {
      const days = (now - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24);
      if (days <= 7) {
        ageGroup1 += inv.grandTotal;
      } else if (days <= 30) {
        ageGroup2 += inv.grandTotal;
      } else {
        ageGroup3 += inv.grandTotal;
      }
    }
    const agingAnalysis = {
      underWeek: Number(ageGroup1.toFixed(2)),
      underMonth: Number(ageGroup2.toFixed(2)),
      overMonth: Number(ageGroup3.toFixed(2)),
    };

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalVendors,
        totalRFQs,
        openRFQs,
        reviewRFQs,
        completedRFQs,
        paidInvoicesCount,
        unpaidInvoicesCount,
        totalSpendUSD: Number(totalSpendINR.toFixed(2)),
        totalSpendINR: Number(totalSpendINR.toFixed(2)),
        avgCycleDays,
        totalSavingsINR: Number(totalSavingsINR.toFixed(2)),
      },
      spendByMonth,
      spendByCategory,
      vendorPerformance,
      agingAnalysis,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Export spend analytics as CSV
// @route   GET /api/analytics/export
// @access  Private (Admin, Procurement Officer, Manager)
exports.exportAnalyticsCSV = async (req, res) => {
  try {
    const Invoice = require("../models/Invoice");
    const Vendor = require("../models/Vendor");

    // Spend by month
    const monthlySpendAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$grandTotal" } } },
      { $sort: { _id: 1 } },
    ]);

    // Spend by vendor category
    const vendorSpendAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: "$vendorId", total: { $sum: "$grandTotal" } } },
    ]);
    const categoryTotals = {};
    for (const item of vendorSpendAgg) {
      if (item._id) {
        const vendor = await Vendor.findById(item._id);
        const cat = vendor ? vendor.category || "General Supply" : "General Supply";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.total;
      }
    }

    // Build CSV
    let csv = "Section,Label,Value (INR)\n";

    csv += "\nMonthly Spend,,\n";
    for (const row of monthlySpendAgg) {
      csv += `Monthly Spend,${row._id},${row.total.toFixed(2)}\n`;
    }

    csv += "\nCategory Spend,,\n";
    for (const [cat, val] of Object.entries(categoryTotals)) {
      csv += `Category Spend,${cat},${val.toFixed(2)}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="vendorbridge_spend_analytics_${new Date().toISOString().substring(0, 10)}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get vendor's own performance analytics (for Vendor Portal Dashboard)
// @route   GET /api/analytics/vendor-self
// @access  Private (Vendor only)
exports.getVendorSelfAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found." });
    }

    // 1. Quotation counts
    const totalQuotations    = await Quotation.countDocuments({ vendorId: vendor._id });
    const submittedQuotations= await Quotation.countDocuments({ vendorId: vendor._id, status: "Submitted" });
    const revisedQuotations  = await Quotation.countDocuments({ vendorId: vendor._id, status: "Revised" });
    const selectedQuotations = await Quotation.countDocuments({ vendorId: vendor._id, status: "Selected" });
    const rejectedQuotations = await Quotation.countDocuments({ vendorId: vendor._id, status: "Rejected" });
    const winRate = totalQuotations > 0 ? Math.round((selectedQuotations / totalQuotations) * 100) : 0;

    // 2. Purchase Orders
    const totalPOs  = await PurchaseOrder.countDocuments({ vendorId: vendor._id });
    const activePOs = await PurchaseOrder.countDocuments({ vendorId: vendor._id, status: "Issued" });
    const paidPOs   = await PurchaseOrder.countDocuments({ vendorId: vendor._id, status: "Paid" });

    // 3. Revenue earned from paid invoices
    const revenueAgg = await Invoice.aggregate([
      { $match: { vendorId: vendor._id, status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalRevenueINR = revenueAgg[0]?.total || 0;

    // 4. Open RFQ invitations count
    const openRFQCount = await RFQ.countDocuments({
      assignedVendors: vendor._id,
      status: "Open",
    });

    // 5. Recent quotations (latest 5) with RFQ populated
    const recentQuotations = await Quotation.find({ vendorId: vendor._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("rfqId", "title status deadline");

    // 6. Recent RFQ invitations (latest 4)
    const recentRFQs = await RFQ.find({
      assignedVendors: vendor._id,
      status: { $in: ["Open", "Under Review", "Closed", "Completed"] },
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("createdBy", "firstName lastName");

    // 7. Monthly revenue trend
    const monthlyRevenueAgg = await Invoice.aggregate([
      { $match: { vendorId: vendor._id, status: "Paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$grandTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const monthlyRevenue = monthlyRevenueAgg.map((item) => ({
      month: item._id,
      amount: Number(item.total.toFixed(2)),
    }));

    res.json({
      success: true,
      vendorProfile: {
        companyName: vendor.companyName,
        category: vendor.category,
        rating: vendor.rating,
        status: vendor.status,
        gstNumber: vendor.gstNumber,
        contactEmail: vendor.contactEmail,
      },
      metrics: {
        totalQuotations,
        submittedQuotations,
        revisedQuotations,
        selectedQuotations,
        rejectedQuotations,
        winRate,
        totalPOs,
        activePOs,
        paidPOs,
        totalRevenueINR: Number(totalRevenueINR.toFixed(2)),
        openRFQCount,
      },
      recentQuotations,
      recentRFQs,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
