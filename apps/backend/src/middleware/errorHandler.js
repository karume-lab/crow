/**
 * Global error handler — this catches anything that slips past
 * individual try/catch blocks and gives a clean JSON response
 * rather than leaking raw stack traces to the client.
 */
function errorHandler(err, _req, res, _next) {
	// Log the full error server-side for debugging
	console.error("[Error]", err.message || err);

	// Multer file size exceeded
	if (err.code === "LIMIT_FILE_SIZE") {
		return res
			.status(413)
			.json({ error: "File too large. Maximum allowed size is 10 MB." });
	}

	// Custom file type rejection from the upload middleware
	if (err.message?.startsWith("File type not allowed")) {
		return res.status(415).json({ error: err.message });
	}

	// Anything else — don't expose internals
	return res
		.status(500)
		.json({ error: "Something went wrong. Please try again." });
}

module.exports = errorHandler;
