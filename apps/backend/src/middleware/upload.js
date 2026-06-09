const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Create the uploads folder if it doesn't exist yet
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Name each file clearly so it's obvious which escrow it belongs to
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
	filename: (req, file, cb) => {
		const escrowId = req.params.id;
		const ext = path.extname(file.originalname).toLowerCase();
		const timestamp = Date.now();
		cb(null, `escrow-${escrowId}-${timestamp}${ext}`);
	},
});

// Only allow file types that make sense for dispute evidence
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".zip", ".txt"];

const fileFilter = (_req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase();
	if (ALLOWED_EXTENSIONS.includes(ext)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				`File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS.join(", ")}`,
			),
		);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10 MB cap
	},
});

module.exports = upload;
