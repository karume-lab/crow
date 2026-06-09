#!/bin/bash

echo "Starting full reset of Project Crow environment..."

# 1. Reset Docker Node (Wipe the ledger)
echo "Wiping Docker node..."
docker rm -f crow-stellar-standalone > /dev/null 2>&1
docker compose up -d

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
echo "   (Or run: localStorage.clear() in your browser console)"

echo "Environment reset successfully."

echo "Automatically running final re-init steps..."

# A. Fund your fresh deployer
stellar keys generate dev_deployer --network standalone --fund

# B. Redeploy the contract
cd apps/contract
echo "Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/micro_escrow.wasm \
  --source-account dev_deployer \
  --network standalone \
  --alias docker_escrow)

# C. Refresh your bindings
stellar contract bindings typescript \
  --network standalone \
  --id docker_escrow \
  --output-dir ../frontend/src/contracts/micro-escrow

# D. Generate and fund mock profiles for testing
echo "Generating mock profiles..."
stellar keys generate mock_client --network standalone --fund > /dev/null 2>&1 || true
stellar keys generate mock_freelancer --network standalone > /dev/null 2>&1 || true
stellar keys generate mock_arbiter --network standalone > /dev/null 2>&1 || true

MOCK_CLIENT=$(stellar keys address mock_client)
MOCK_FREELANCER=$(stellar keys address mock_freelancer)
MOCK_ARBITER=$(stellar keys address mock_arbiter)
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
