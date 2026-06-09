#!/bin/bash
cd "$(dirname "$0")/.."

echo "Starting full reset of Project Crow environment..."

# 1. Reset Docker Node (Wipe the ledger)
echo "Wiping Docker node..."
docker rm -f crow-stellar-standalone > /dev/null 2>&1
docker compose up -d

echo "Waiting for Docker node (Soroban RPC) to initialize..."
until $(curl -s -f -o /dev/null -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"getHealth","params":[],"id":1}' \
  http://localhost:8000/soroban/rpc); do
    printf '.'
    sleep 2
done
echo "RPC engine is online!"

# 2. Reset CLI Network configuration
echo "Resetting CLI networks..."
stellar network rm standalone > /dev/null 2>&1
stellar network add \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  standalone

# 3. Wipe Backend Data
echo "Clearing backend database..."
rm -f apps/backend/data/crow.db
rm -rf apps/backend/uploads/*

# 4. Clear Frontend LocalStorage
echo "Please clear your browser cache/storage for localhost:5173"
echo "  (Or run: localStorage.clear() in your browser console)"

echo "Environment reset successfully."

echo "Automatically running final re-init steps..."

# A. Fund your fresh deployer directly via local Friendbot API
echo "Generating dev_deployer keys..."
stellar keys rm --force dev_deployer > /dev/null 2>&1 || true
stellar keys generate dev_deployer > /dev/null 2>&1
DEV_ADDRESS=$(stellar keys address dev_deployer)

echo "Funding dev_deployer ($DEV_ADDRESS) via local Friendbot..."
# Loop until Friendbot actually succeeds (returns HTTP 200)
while ! curl -s -f "http://localhost:8000/friendbot?addr=$DEV_ADDRESS" > /dev/null; do
  echo "Friendbot is still booting. Retrying in 3 seconds..."
  sleep 3
done

echo "Funding transaction submitted! Waiting 3 seconds for ledger close..."
sleep 3

# B. Redeploy the contract
cd apps/contract
echo "Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/micro_escrow.wasm \
  --source-account dev_deployer \
  --network standalone \
  --alias docker_escrow)

echo "Contract deployed with ID: $CONTRACT_ID"

# C. Refresh your bindings (with --overwrite)
echo "Generating TypeScript bindings..."
stellar contract bindings typescript \
  --network standalone \
  --id docker_escrow \
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
echo "Generating mock profiles..."
stellar keys rm --force mock_client > /dev/null 2>&1 || true
stellar keys rm --force mock_freelancer > /dev/null 2>&1 || true
stellar keys rm --force mock_arbiter > /dev/null 2>&1 || true

stellar keys generate mock_client > /dev/null 2>&1
stellar keys generate mock_freelancer > /dev/null 2>&1
stellar keys generate mock_arbiter > /dev/null 2>&1

MOCK_CLIENT=$(stellar keys address mock_client)
MOCK_FREELANCER=$(stellar keys address mock_freelancer)
MOCK_ARBITER=$(stellar keys address mock_arbiter)

echo "Funding mock_client ($MOCK_CLIENT) via local Friendbot..."
while ! curl -s -f "http://localhost:8000/friendbot?addr=$MOCK_CLIENT" > /dev/null; do
  echo "Friendbot retry..."
  sleep 2
done

echo "Funding mock_freelancer ($MOCK_FREELANCER) via local Friendbot..."
while ! curl -s -f "http://localhost:8000/friendbot?addr=$MOCK_FREELANCER" > /dev/null; do
  echo "Friendbot retry..."
  sleep 2
done

echo "Funding mock_arbiter ($MOCK_ARBITER) via local Friendbot..."
while ! curl -s -f "http://localhost:8000/friendbot?addr=$MOCK_ARBITER" > /dev/null; do
  echo "Friendbot retry..."
  sleep 2
done

echo "Deploying Native XLM token wrapper..."
stellar contract asset deploy --asset native --source-account dev_deployer --network standalone > /dev/null 2>&1 || true
TOKEN_ID=$(stellar contract id asset --asset native --network standalone)

echo "Writing environment variables to apps/frontend/.env..."
cat <<EOF > ../frontend/.env
VITE_API_URL="http://localhost:3001/api"
VITE_CONTRACT_ID=$CONTRACT_ID
VITE_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
VITE_RPC_URL="http://localhost:8000/soroban/rpc"
VITE_MOCK_CLIENT=$MOCK_CLIENT
VITE_MOCK_FREELANCER=$MOCK_FREELANCER
VITE_MOCK_ARBITER=$MOCK_ARBITER
VITE_DEFAULT_TOKEN=$TOKEN_ID
EOF

echo "Full reset and re-initialization complete! You are ready for testing."