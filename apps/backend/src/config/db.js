const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/crow.db');

// Make sure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

/**
 * Initialise the SQLite database.
 * sql.js loads a WASM binary, so this is async — call it once at startup
 * (in app.js) before the server begins accepting requests.
 */
async function initDb() {
    const SQL = await initSqlJs();

    // If a database file exists on disk, load it; otherwise start fresh
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    createTables();

    // Persist the DB to disk on clean process exit
    process.on('exit', saveDb);
    process.on('SIGINT', () => {
        saveDb();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        saveDb();
        process.exit(0);
    });

    return db;
}

function createTables() {
    db.run(`
    CREATE TABLE IF NOT EXISTS escrow_metadata (
      escrow_id     INTEGER PRIMARY KEY,
      title         TEXT    NOT NULL,
      description   TEXT    NOT NULL,
      client_address TEXT   NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS dispute_submissions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      escrow_id      INTEGER NOT NULL,
      sender         TEXT    NOT NULL,
      statement      TEXT    NOT NULL,
      attachment_url TEXT,
      submitted_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);
}

/**
 * Write the current in-memory database back to disk.
 * sql.js works entirely in memory, so we need to flush manually.
 */
function saveDb() {
    if (!db) return;
    try {
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (err) {
        console.error('[DB] Failed to save database to disk:', err.message);
    }
}

/**
 * Returns the active database instance.
 * Throws if initDb() was never awaited — this is intentional so startup
 * failures are loud rather than silent.
 */
function getDb() {
    if (!db) {
        throw new Error('Database not initialised. Did you call initDb() before starting the server?');
    }
    return db;
}

/**
 * A thin helper that mirrors the better-sqlite3 API so the controllers
 * don't need to care which SQLite library is underneath.
 *
 * Usage:
 *   query('SELECT * FROM escrow_metadata WHERE escrow_id = ?', [102])
 *   => [{ escrow_id: 102, title: '...', ... }]
 */
function query(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();

    // Persist after every write operation
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP)/i.test(sql)) {
        saveDb();
    }

    return rows;
}

/**
 * Run a statement that doesn't return rows (INSERT, UPDATE, DELETE).
 */
function run(sql, params = []) {
    const db = getDb();
    db.run(sql, params);
    saveDb();
}

/**
 * Fetch a single row, or null if nothing matches.
 */
function queryOne(sql, params = []) {
    const rows = query(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { initDb, getDb, query, run, queryOne, saveDb };
