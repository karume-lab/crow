const router = require("express").Router();

const escrowController = require("#src/controllers/escrowController");
const disputeController = require("#src/controllers/disputeController");
const upload = require("#src/middleware/upload");

// Escrow metadata
router.post("/:id/metadata", escrowController.saveMetadata);
router.get("/:id/metadata", escrowController.getMetadata);

// Dispute evidence — accepts an optional file attachment
router.post(
	"/:id/dispute-evidence",
	upload.single("file"),
	disputeController.submitEvidence,
);
router.get("/:id/disputes", disputeController.getDisputes);

module.exports = router;
