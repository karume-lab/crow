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

1. Rust Toolchain: Install the Rust programming language.
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. WebAssembly Target: Install the wasm32 compilation target.
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
3. Stellar CLI: The command-line interface tool to build, deploy, and interact with contracts.
   ```bash
   cargo install --locked stellar-cli --features opt
   ```

### Project Compilation

To compile the contract to the WebAssembly target, execute the following command:

```bash
cargo build --manifest-path apps/contract/Cargo.toml --target wasm32-unknown-unknown --release
```

To run all multi-actor unit tests, run:

```bash
cargo test --manifest-path apps/contract/Cargo.toml
```

---

## Comprehensive Testnet Deployment Steps

Follow these step-by-step commands to deploy the smart contract to the Stellar Testnet:

### 1. Configure the Stellar Network

Add the Stellar Testnet configuration to your local CLI profile:

```bash
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 2. Generate Deployer Identity

Create a new cryptographic keypair representing the deployer's account:

```bash
stellar keys generate --global deployer
```

To retrieve the public key of the newly generated account:

```bash
stellar keys address deployer
```

### 3. Fund Deployer Account

Request test tokens (XLM) from the Friendbot service to fund your newly generated deployer account:

```bash
curl -X POST "https://friendbot.stellar.org?addr=$(stellar keys address deployer)"
```

### 4. Optimize the Contract Binary

Before deploying the contract, optimize the WASM binary to minimize size and gas consumption:

```bash
stellar contract optimize \
  --wasm apps/contract/target/wasm32-unknown-unknown/release/micro_escrow.wasm
```

The optimized WASM file will be saved under:
`apps/contract/target/wasm32-unknown-unknown/release/micro_escrow.optimized.wasm`

### 5. Deploy the Contract

Deploy the optimized WASM binary to the Stellar Testnet using the deployer identity:

```bash
stellar contract deploy \
  --network testnet \
  --source-profile deployer \
  --wasm apps/contract/target/wasm32-unknown-unknown/release/micro_escrow.optimized.wasm
```

Upon successful deployment, the command outputs the deployed contract ID (e.g., `CDA7...`). Copy this value and paste it into your local `.env` configuration file under `DEPLOYED_CONTRACT_ID`.

### 6. Generate TypeScript Bindings

To easily integrate the contract into a frontend or backend application, generate the TypeScript client bindings:

```bash
stellar contract bindings typescript \
  --network testnet \
  --contract-id YOUR_DEPLOYED_CONTRACT_ID \
  --output-dir ./bindings/micro-escrow
```