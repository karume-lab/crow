# Crow — Frontend SPA dApp

This is the React + TypeScript frontend dashboard for the **Secure Digital Handshake** micro-escrow protocol built on Stellar Soroban.

It integrates directly with the Freighter Wallet and the auxiliary Express metadata backend API.

---

## Getting Started

### 1. Install dependencies

Ensure you have [Bun](https://bun.sh) installed. Then run:

```bash
cd apps/frontend
bun install
```

### 2. Run the application

To start the local Vite development server:

```bash
bun run dev
```

The application runs at `http://localhost:5173`.

### 3. Production Build

To compile and check types:

```bash
bun run build
```

The optimized assets will be built into the `dist/` folder.
