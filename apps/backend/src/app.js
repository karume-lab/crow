require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("node:path");

const { initDb } = require("./config/db");
const escrowRoutes = require("./routes/escrows");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded dispute evidence files as static assets
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- Routes ---
app.use("/api/escrows", escrowRoutes);

// Simple health check so the frontend team can verify the API is up
app.get("/health", (_req, res) => {
	res.json({ status: "ok", message: "Crow backend is running" });
});

// --- Catch-all for unknown routes ---
app.use((_req, res) => {
	res.status(404).json({ error: "Route not found" });
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

// Boot sequence — initialise the DB before accepting any traffic
async function start() {
	try {
		await initDb();
		console.log("[DB] Database ready");

		app.listen(PORT, () => {
			console.log(`Crow backend is running at http://localhost:${PORT}`);
		});
	} catch (err) {
		console.error("[Startup] Failed to initialise database:", err.message);
		process.exit(1);
	}
}

start();

module.exports = app;
