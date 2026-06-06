const ActivityLog = require("../models/ActivityLog");

/**
 * Asynchronously save system activity to database.
 * @param {string|null} userId - The user ID who initiated the event (null if system or unauthenticated)
 * @param {string} action - Action identifier (e.g. 'RFQ_CREATED')
 * @param {string} details - Detailed human-readable explanation
 */
exports.logActivity = async (userId, action, details) => {
  try {
    await ActivityLog.create({
      userId: userId || null,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to save activity log:", error.message);
  }
};
