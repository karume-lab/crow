# Secure Digital Handshake (Micro-Escrow) Protocol

This repository contains the smart contract implementation for the Secure Digital Handshake (Micro-Escrow) protocol built on Stellar Soroban. The protocol provides a trustless, decentralized digital escrow mechanism enabling secure transactions between clients and freelancers, mediated by an optional designated arbiter.

## Executive Overview

The Micro-Escrow protocol is designed to eliminate the counterparty risk associated with digital freelancing and micro-services. By implementing this protocol on the Stellar network, we achieve low-latency, low-cost execution, and robust cryptographic verification of agreements.

### Architectural Goals

- Trust Minimized Agreements: Funds are locked in the smart contract environment upon initialization and can only be released to the freelancer by the client, or split between the parties by the designated arbiter.
- Multi-Actor Dispute Resolution: If an agreement cannot be fulfilled to the client's satisfaction, either party can trigger a dispute. A neutral third-party (arbiter) resolves the dispute by splitting the escrowed funds proportionally.
- Stellar native SEP-41 Integration: The contract utilizes native and wrapper tokens complying with the SEP-41 standard (e.g., native XLM or USDC).
- Gas and Storage Optimization: By utilizing state-expiration-aware storage (Persistent and Instance storage) and compact contract sizing, we minimize execution costs.

---

## Project Structure

- Cargo.toml: Workspace configuration.
- README.md: Comprehensive setup and deployment instructions.
- .env.example: Configuration template for deployment environment variables.
- apps/contract/: Smart contract implementation.
  - Cargo.toml: Contract dependencies.
  - README.md: State management matrix and functional interface details.
  - src/lib.rs: Main contract entrypoint, logic, and multi-actor unit tests.

---

## Local Setup Instructions

### Prerequisites

To compile and test the contracts locally, you need the following dependencies installed on your system:

1. **Rust Toolchain**: Install the Rust programming language:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **WebAssembly Target**: Install the wasm32 compilation target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
3. **Stellar CLI**: The command-line interface tool to build, deploy, and interact with contracts:
   ```bash
   cargo install --locked stellar-cli --features opt
   ```

---

### Step-by-Step Setup

Follow these phases in order to set up, deploy, and run the project locally.

#### Phase 1: The Clean Slate

First, we need to nuke any broken configurations or hanging containers so they don't block our fresh setup.

* **Kill any old containers**:
  ```bash
  docker rm -f crow-stellar-standalone
  ```
* **Clear out the old CLI network (if it exists)**:
  ```bash
  stellar network rm standalone
  ```

#### Phase 2: Boot the Local Blockchain (Docker)

We will spin up a fresh, ephemeral local Stellar node.

* **Start the Docker container**:
  ```bash
  docker compose up -d
  ```
* **Wait 15 seconds, then verify the node is alive**:
  ```bash
  curl http://localhost:8000
  ```
  *(If you see a JSON response containing `"horizon_version"`, your local blockchain is officially running).*

#### Phase 3: Configure the CLI & Fund Your Account

Now we tell your machine how to talk to that Docker container.

* **Map the network to Port 8000 (Quickstart's unified port)**:
  ```bash
  stellar network add \
    --rpc-url http://localhost:8000/soroban/rpc \
    --network-passphrase "Standalone Network ; February 2017" \
    standalone
  ```
* **Generate and fund your deployer account**:
  *(Because the network is mapped to port 8000, `--fund` will hit the Docker container's internal Friendbot perfectly).*
  ```bash
  stellar keys generate dev_deployer --network standalone --fund
  ```

#### Phase 4: Compile & Deploy the Contract

Let's get your Rust code onto the Docker blockchain.

* **Navigate to the contract directory**:
  ```bash
  cd apps/contract
  ```
* **Compile and optimize the contract**:
  *(The `--optimize` flag compiles and optimizes the WASM binary in a single command, which outputs to `target/wasm32v1-none/release/micro_escrow.wasm`)*
  ```bash
  stellar contract build --optimize
  ```
* **Deploy it to the Docker node**:
  ```bash
  stellar contract deploy \
    --wasm target/wasm32v1-none/release/micro_escrow.wasm \
    --source-account dev_deployer \
    --network standalone \
    --alias docker_escrow
  ```
  > [!IMPORTANT]
  > The terminal will spit out a 56-character string starting with the letter `C` (e.g., `CAGIHNGV...`). Copy this string to your clipboard.

#### Phase 5: Generate Bindings & Boot the Backend

We need to generate the TypeScript drivers, then start your Express database server.

* **Generate the Frontend Types**: *(Run this while still inside `apps/contract`)*
  ```bash
  stellar contract bindings typescript \
    --network standalone \
    --id docker_escrow \
    --output-dir ../frontend/src/contracts/micro-escrow
  ```
* **Navigate to the backend and install dependencies**:
  ```bash
  cd ../backend
  bun install
  ```
* **Create the Backend Environment File**:
  Create a file named `.env` inside `apps/backend` and paste this exact text:
  ```env
  PORT=3001
  DB_PATH=./data/crow.db
  BASE_URL=http://localhost:3001
  ```
* **Start the Backend**:
  ```bash
  bun run dev
  ```
  *(Leave this terminal tab open and running).*

#### Phase 6: Boot the Frontend

Open a brand new terminal tab/window so you don't kill the backend.

* **Navigate to the frontend and install dependencies**:
  ```bash
  cd apps/frontend
  bun install
  ```
* **Create the Frontend Environment File**:
  Create a file named `.env` inside `apps/frontend` and paste this exact text (replace `PASTE_YOUR_CONTRACT_ID_HERE` with the `C...` string you copied in Phase 4):
  ```env
  VITE_API_URL=http://localhost:3001/api
  VITE_CONTRACT_ID=PASTE_YOUR_CONTRACT_ID_HERE
  ```
* **Start the Frontend**:
  ```bash
  bun run dev
  ```

#### Phase 7: The Grand Test (End-to-End Walkthrough)

Open your browser to `http://localhost:5173`. Everything is now fully connected. Let's test the circuit:

1. **Connect**: Click **Connect Wallet** in the top right. Select **Client Profile** under the simulated local profiles.
2. **Draft the Escrow**:
   * **Title**: Hackathon Bounty
   * **Description**: Build the UI
   * **Freelancer Address**: `GAFREELANCER1234567890ABCDEF1234567890ABCDEF1234567`
   * **Arbiter Address**: `GAARBITER1234567890ABCDEF1234567890ABCDEF1234567890`
   * **Token Address**: `GATOKENUSDC1234567890ABCDEF1234567890ABCDEF12345678`
   * **Amount**: `5000`
3. **Deploy**: Click **Approve Tokens**, wait a second, then click **Deploy Escrow**.
4. **Verify**: You will see a loading state, and then a new Dashboard card will pop up. This means the contract saved the state on the Docker node, and the backend saved the text metadata to SQLite successfully.

Follow these steps exactly in order. If you hit an error at any specific step, stop and paste the exact error so it can be resolved immediately.