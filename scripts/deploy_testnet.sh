#!/bin/bash

echo "Starting Project Crow Testnet deployment..."

# 1. Wipe Backend Data
echo "Clearing backend database..."
rm -f apps/backend/data/crow.db
rm -rf apps/backend/uploads/*

# 2. Clear Frontend LocalStorage
echo "Please clear your browser cache/storage for localhost:5173"
echo "  (Or run: localStorage.clear() in your browser console)"

echo "Environment reset successfully."
echo "Starting deployment sequence..."

echo "Configuring CLI networks for testnet..."
stellar network rm testnet > /dev/null 2>&1 || true
stellar network add \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" \
  testnet

# A. Fund your fresh deployer directly via public Testnet Friendbot
echo "Generating testnet_deployer keys..."
stellar keys rm --force testnet_deployer > /dev/null 2>&1 || true
stellar keys generate testnet_deployer > /dev/null 2>&1
DEV_ADDRESS=$(stellar keys address testnet_deployer)

echo "Funding testnet_deployer ($DEV_ADDRESS) via public Friendbot..."
# Loop until Friendbot succeeds (returns HTTP 200). The public API occasionally rate limits.
while ! curl -s -f "https://friendbot.stellar.org/?addr=$DEV_ADDRESS" > /dev/null; do
  echo "Public Friendbot is busy. Retrying in 5 seconds..."
  sleep 5
done

echo "Funding transaction submitted! Waiting 5 seconds for ledger close..."
sleep 5

# B. Redeploy the contract to Testnet
cd apps/contract
echo "Deploying contract to Testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/micro_escrow.wasm \
  --source-account testnet_deployer \
  --network testnet \
  --alias testnet_escrow)

echo "Contract deployed with ID: $CONTRACT_ID"

# C. Refresh your bindings (with --overwrite)
echo "Generating TypeScript bindings for Testnet..."
stellar contract bindings typescript \
  --network testnet \
  --id testnet_escrow \
  --output-dir ../frontend/src/contracts/micro-escrow \
  --overwrite

echo "Restoring README.md to prevent dirty git tree..."
git checkout -- ../frontend/src/contracts/micro-escrow/README.md > /dev/null 2>&1 || true

echo "Patching TypeScript bindings for Vite compatibility..."
node -e "
const fs = require('fs');
const file = '../frontend/src/contracts/micro-escrow/src/index.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove export * to fix Vite
code = code.replace('export * from \"@stellar/stellar-sdk\";', '// export * from \"@stellar/stellar-sdk\";');

// 2. Add global ImportMeta
const augment = \`declare global {
  interface ImportMeta {
    env: Record<string, string | undefined>;
  }
}
\`;
code = augment + code;

// 3. Use env variable for contractId
code = code.replace(/contractId: \"[A-Z0-9]+\"/, 'contractId: import.meta.env.VITE_CONTRACT_ID as string');

// 4. Remove unused imports that cause TS errors
code = code.replace('import { Address } from \"@stellar/stellar-sdk\";', '');
code = code.replace('Result,', '');
code = code.replace('u64,', '');
code = code.replace('i64,', '');
code = code.replace('u128,', '');
code = code.replace('u256,', '');
code = code.replace('i256,', '');
code = code.replace('Timepoint,', '');
code = code.replace('Duration,', '');
code = code.replace('i32,', '');

fs.writeFileSync(file, code);
"

echo "Building TypeScript bindings..."
cd ../frontend/src/contracts/micro-escrow
bun install > /dev/null 2>&1
bun run build > /dev/null 2>&1
cd - > /dev/null

# D. Generate and fund mock profiles for testing
echo "Generating Testnet mock profiles..."
stellar keys rm --force testnet_mock_client > /dev/null 2>&1 || true
stellar keys rm --force testnet_mock_freelancer > /dev/null 2>&1 || true
stellar keys rm --force testnet_mock_arbiter > /dev/null 2>&1 || true

stellar keys generate testnet_mock_client > /dev/null 2>&1
stellar keys generate testnet_mock_freelancer > /dev/null 2>&1
stellar keys generate testnet_mock_arbiter > /dev/null 2>&1

MOCK_CLIENT=$(stellar keys address testnet_mock_client)
MOCK_FREELANCER=$(stellar keys address testnet_mock_freelancer)
MOCK_ARBITER=$(stellar keys address testnet_mock_arbiter)

echo "Funding testnet_mock_client ($MOCK_CLIENT)..."
while ! curl -s -f "https://friendbot.stellar.org/?addr=$MOCK_CLIENT" > /dev/null; do
  echo "Friendbot retry..."
  sleep 5
done
sleep 2 # Pause to avoid strict IP rate limiting

echo "Funding testnet_mock_freelancer ($MOCK_FREELANCER)..."
while ! curl -s -f "https://friendbot.stellar.org/?addr=$MOCK_FREELANCER" > /dev/null; do
  echo "Friendbot retry..."
  sleep 5
done
sleep 2

echo "Funding testnet_mock_arbiter ($MOCK_ARBITER)..."
while ! curl -s -f "https://friendbot.stellar.org/?addr=$MOCK_ARBITER" > /dev/null; do
  echo "Friendbot retry..."
  sleep 5
done

echo "Fetching Native XLM token wrapper ID..."
TOKEN_ID=$(stellar contract id asset --asset native --network testnet)

echo "Writing environment variables to apps/frontend/.env..."
cat <<EOF > ../frontend/.env
VITE_API_URL="http://localhost:3001/api"
VITE_CONTRACT_ID=$CONTRACT_ID
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_RPC_URL="https://soroban-testnet.stellar.org:443"
VITE_MOCK_CLIENT=$MOCK_CLIENT
VITE_MOCK_FREELANCER=$MOCK_FREELANCER
VITE_MOCK_ARBITER=$MOCK_ARBITER
VITE_DEFAULT_TOKEN=$TOKEN_ID
EOF

echo "Testnet deployment and environment configuration complete!"