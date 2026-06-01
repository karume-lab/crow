# Crow — Backend API

This is the companion metadata API for **Secure Digital Handshake**, a micro-escrow dApp built on Stellar Soroban.

The smart contract handles the actual money — locking, releasing, and resolving funds on-chain. This backend handles everything that would be too expensive to store on the ledger: escrow titles, descriptions, and dispute evidence from both parties.

---

## What It Does

| Endpoint | Purpose |
|---|---|
| `POST /api/escrows/:id/metadata` | Save a title and description for a new escrow |
| `GET /api/escrows/:id/metadata` | Fetch the details for an escrow card in the UI |
| `POST /api/escrows/:id/dispute-evidence` | Submit a statement + optional file when a dispute is flagged |
| `GET /api/escrows/:id/disputes` | Pull the full dispute dossier so the Arbiter can review it |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite via `better-sqlite3` (zero config, file-based)
- **File uploads:** Multer

---

## Getting Started

### 1. Install dependencies

```bash
cd apps/backend
npm install
```

### 2. Set up your environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

The defaults work fine for local development — you don't need to change anything to get started.

### 3. Run the server

**Development (with auto-restart on file changes):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server starts on `http://localhost:3001` by default. Hit `/health` to confirm it's running.

---

## API Reference

### Save Escrow Metadata

**`POST /api/escrows/:id/metadata`**

Call this right after `create_escrow` succeeds on the smart contract. Pass the returned escrow ID as `:id`.

**Request body (JSON):**
```json
{
  "title": "Redesign Landing Page for Acme Corp",
  "description": "Implement a fully responsive monochromatic layout...",
  "client_address": "GB..."
}
```

**Response `201 Created`:**
```json
{
  "message": "Metadata saved successfully",
  "escrow_id": 102
}
```

---

### Get Escrow Metadata

**`GET /api/escrows/:id/metadata`**

**Response `200 OK`:**
```json
{
  "escrow_id": 102,
  "title": "Redesign Landing Page for Acme Corp",
  "description": "Implement a fully responsive monochromatic layout...",
  "client_address": "GB...",
  "created_at": "2026-06-01T15:59:00Z"
}
```

---

### Submit Dispute Evidence

**`POST /api/escrows/:id/dispute-evidence`**

Send as `multipart/form-data`. The `file` field is optional — a written statement alone is valid.

**Fields:**
| Field | Type | Required |
|---|---|---|
| `sender_address` | string | Yes |
| `statement` | string | Yes |
| `file` | binary | No |

Accepted file types: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.zip`, `.txt` — max 10 MB.

**Response `202 Accepted`:**
```json
{
  "message": "Evidence submitted successfully",
  "escrow_id": 102,
  "attachment_url": "http://localhost:3001/uploads/escrow-102-1717257600000.pdf"
}
```

---

### Get Dispute Dossier

**`GET /api/escrows/:id/disputes`**

Returns every submission for an escrow in chronological order. This is what the Arbiter reads before making their decision.

**Response `200 OK`:**
```json
{
  "escrow_id": 102,
  "dispute_status": "open",
  "submissions": [
    {
      "sender": "GD...",
      "statement": "I deployed the site and sent the repo, but the client is not responding.",
      "attachment_url": "http://localhost:3001/uploads/escrow-102-1717257600000.zip",
      "submitted_at": "2026-06-01T16:15:00Z"
    }
  ]
}
```

---

## Project Structure

```
apps/backend/
├── src/
│   ├── app.js                  # Express entry point
│   ├── config/
│   │   └── db.js               # SQLite setup and table creation
│   ├── controllers/
│   │   ├── escrowController.js # Metadata endpoints
│   │   └── disputeController.js# Dispute endpoints
│   ├── middleware/
│   │   ├── upload.js           # Multer file upload config
│   │   └── errorHandler.js     # Global error handler
│   └── routes/
│       └── escrows.js          # Route definitions
├── uploads/                    # Uploaded evidence files (not committed)
├── data/                       # SQLite database file (not committed)
├── .env.example
├── .gitignore
└── package.json
```

---

## Connecting to the Smart Contract

The backend doesn't talk to the blockchain directly — that's the frontend's job. The typical flow is:

1. **Frontend** calls `create_escrow(...)` on the Soroban contract → gets back an `escrow_id`
2. **Frontend** immediately calls `POST /api/escrows/:id/metadata` with the title and description
3. **Frontend** calls `GET /api/escrows/:id/metadata` to populate escrow cards in the dashboard
4. When a dispute is flagged on-chain, either party calls `POST /api/escrows/:id/dispute-evidence`
5. The Arbiter opens `GET /api/escrows/:id/disputes`, reviews everything, then calls `resolve_dispute(...)` on-chain

---

## Deployment Notes

- Set `BASE_URL` in your `.env` to your production domain so attachment URLs are correct (e.g. `https://api.yourdomain.com`)
- The `uploads/` folder needs to be persistent — if you're deploying to a platform like Render, configure a persistent disk mounted at `./uploads`
- The SQLite database (`data/crow.db`) also needs to live on a persistent disk in production
- For higher traffic, the database layer can be swapped out for PostgreSQL with minimal changes to `src/config/db.js`
