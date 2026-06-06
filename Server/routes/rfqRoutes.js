const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfqController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All RFQ routes require authentication
router.use(protect);

router
  .route("/")
  .post(authorize("Procurement Officer"), rfqController.createRFQ)
  .get(rfqController.getRFQs);

router
  .route("/:id")
  .get(rfqController.getRFQById)
  .put(authorize("Procurement Officer"), rfqController.updateRFQ)
  .delete(authorize("Procurement Officer"), rfqController.deleteRFQ);

router.put(
  "/:id/select-bid",
  authorize("Procurement Officer"),
  rfqController.selectBid
);

router.put(
  "/:id/approve",
  authorize("Manager"),
  rfqController.approveRFQ
);

router.put(
  "/:id/reject",
  authorize("Manager"),
  rfqController.rejectRFQ
);

module.exports = router;
