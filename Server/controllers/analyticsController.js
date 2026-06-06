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
      },
      spendByMonth,
      spendByCategory,
      vendorPerformance,
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
