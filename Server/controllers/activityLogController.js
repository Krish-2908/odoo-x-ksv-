const ActivityLog = require("../models/ActivityLog");

// @desc    Get system activity logs
// @route   GET /api/activity-logs
// @access  Private (Admin only)
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("userId", "firstName lastName email role")
      .sort({ timestamp: -1 })
      .limit(150); // Fetch up to 150 recent logs

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
