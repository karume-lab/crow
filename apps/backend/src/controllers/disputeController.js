const { query, run } = require("../config/db");

/**
 * POST /api/escrows/:id/dispute-evidence
 *
 * Either party (client or freelancer) can submit a written statement
 * plus an optional file attachment when a dispute is active.
 * The Arbiter will read all submissions via GET /disputes before
 * deciding how to call resolve_dispute on-chain.
 */
const submitEvidence = (req, res, next) => {
	try {
		const escrowId = parseInt(req.params.id, 10);

		if (Number.isNaN(escrowId)) {
			return res.status(400).json({ error: "Escrow ID must be a number" });
		}

		const { sender_address, statement } = req.body;

		if (!sender_address || !statement) {
			return res.status(400).json({
				error: "Missing required fields: sender_address, statement",
			});
		}

		// Build a publicly accessible URL for the uploaded file, if one was sent
		let attachmentUrl = null;
		if (req.file) {
			const baseUrl =
				process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
			attachmentUrl = `${baseUrl}/uploads/${req.file.filename}`;
		}

		run(
			`INSERT INTO dispute_submissions (escrow_id, sender, statement, attachment_url)
       VALUES (?, ?, ?, ?)`,
			[escrowId, sender_address.trim(), statement.trim(), attachmentUrl],
		);

		return res.status(202).json({
			message: "Evidence submitted successfully",
			escrow_id: escrowId,
			attachment_url: attachmentUrl,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * GET /api/escrows/:id/disputes
 *
 * Returns the full dossier of dispute submissions for an escrow, in
 * chronological order. This is what the Arbiter reads before making
 * their resolution decision on-chain.
 */
const getDisputes = (req, res, next) => {
	try {
		const escrowId = parseInt(req.params.id, 10);

		if (Number.isNaN(escrowId)) {
			return res.status(400).json({ error: "Escrow ID must be a number" });
		}

		const submissions = query(
			`SELECT sender, statement, attachment_url, submitted_at
       FROM dispute_submissions
       WHERE escrow_id = ?
       ORDER BY submitted_at ASC`,
			[escrowId],
		);

		return res.json({
			escrow_id: escrowId,
			dispute_status: submissions.length > 0 ? "open" : "none",
			submissions,
		});
	} catch (err) {
		next(err);
	}
};

module.exports = { submitEvidence, getDisputes };
