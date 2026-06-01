# Micro-Escrow Contract Specification

This document details the state management models and functional interface definitions for the Secure Digital Handshake (Micro-Escrow) smart contract on Stellar Soroban.

---

## State Management Matrix

Soroban provides three storage categories: Instance, Persistent, and Temporary. The Micro-Escrow contract uses Instance and Persistent storage models, rejecting Temporary storage due to the risk of state expiration resulting in permanent fund lockups.

| Storage Key | Storage Type | Data Type | Storage Model | Lifecycle Choice Rationale |
|---|---|---|---|---|
| `DataKey::Counter` | Instance | `u32` | Instance | Keeps track of the total number of escrows created. Since this counter is accessed and incremented on every escrow creation, storing it in Instance storage ensures it is loaded and cached with the contract instance itself, avoiding separate fetch overhead. |
| `DataKey::Escrow(u32)` | Persistent | `Escrow` | Persistent | Stores the individual escrow details for a given ID. Because the number of escrows can grow indefinitely, storing each record under its own key in Persistent storage prevents contract instance bloat. Persistent storage prevents accidental data pruning during long-running escrows while allowing parties to extend the Time-To-Live (TTL) independently of the contract instance. |

---

## Functional Interface Specification

### 1. create_escrow

Creates a new escrow record, locks client funds inside the contract, and returns a unique incrementing ID.

- Signature:
  ```rust
  pub fn create_escrow(
      env: Env,
      client: Address,
      freelancer: Address,
      arbiter: Address,
      token: Address,
      amount: i128
  ) -> u32
  ```
- Validation Rules:
  - `client` address must authenticate the transaction via `client.require_auth()`.
  - `amount` must be greater than zero (`amount > 0`).
  - `client`, `freelancer`, and `arbiter` must be distinct addresses.
  - The Native/SEP-41 token transfer from `client` to the contract's own address (`env.current_contract_address()`) must succeed.
- Storage Side Effects:
  - Reads and increments the `DataKey::Counter` in Instance storage.
  - Inserts a new `Escrow` record under `DataKey::Escrow(id)` in Persistent storage.

---

### 2. release_funds

Releases 100% of the locked funds in the escrow to the freelancer. Called when the client is satisfied with the work.

- Signature:
  ```rust
  pub fn release_funds(env: Env, escrow_id: u32)
  ```
- Validation Rules:
  - The escrow record under `escrow_id` must exist in storage.
  - The `client` address recorded in the escrow must authenticate the transaction via `client.require_auth()`.
  - The current status of the escrow must be exactly `EscrowStatus::Active`.
- Storage Side Effects:
  - Updates the status of the escrow record to `EscrowStatus::Completed` and writes it back to Persistent storage.
  - Transfers the entire `amount` of the escrow from the contract to the `freelancer` address using the token contract.

---

### 3. trigger_dispute

Flags an active escrow as disputed, indicating that the client and freelancer have reached an impasse.

- Signature:
  ```rust
  pub fn trigger_dispute(env: Env, caller: Address, escrow_id: u32)
  ```
- Validation Rules:
  - The escrow record under `escrow_id` must exist in storage.
  - The `caller` address must authenticate the transaction via `caller.require_auth()`.
  - The `caller` must be either the `client` or the `freelancer` associated with this escrow.
  - The current status of the escrow must be exactly `EscrowStatus::Active`.
- Storage Side Effects:
  - Updates the status of the escrow record to `EscrowStatus::Disputed` and writes it back to Persistent storage.

---

### 4. resolve_dispute

Resolves a disputed escrow. The arbiter decides how much of the locked escrow funds should go to the freelancer, and the remainder is returned to the client.

- Signature:
  ```rust
  pub fn resolve_dispute(env: Env, escrow_id: u32, freelancer_share: i128)
  ```
- Validation Rules:
  - The escrow record under `escrow_id` must exist in storage.
  - The `arbiter` address recorded in the escrow must authenticate the transaction via `arbiter.require_auth()`.
  - The current status of the escrow must be exactly `EscrowStatus::Disputed`.
  - The `freelancer_share` must be non-negative (`freelancer_share >= 0`).
  - The `freelancer_share` must not exceed the total locked `amount` of the escrow (`freelancer_share <= amount`).
- Storage Side Effects:
  - Transfers `freelancer_share` to the `freelancer`.
  - Transfers the remainder (`amount - freelancer_share`) back to the `client`.
  - Updates the status of the escrow record to `EscrowStatus::Resolved` and writes it back to Persistent storage.
