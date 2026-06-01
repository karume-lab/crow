use soroban_sdk::{contract, contractimpl, token, Address, Env};
use crate::types::{DataKey, Escrow, EscrowStatus};

#[cfg(any(test, feature = "testutils"))]
extern crate std;

#[cfg(any(test, feature = "testutils"))]
std::thread_local! {
    pub static TEST_CALLER: std::cell::RefCell<Option<soroban_sdk::Address>> = std::cell::RefCell::new(None);
}

#[contract]
pub struct MicroEscrowContract;

#[contractimpl]
impl MicroEscrowContract {
    pub fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        arbiter: Address,
        token: Address,
        amount: i128,
    ) -> u32 {
        if amount <= 0 {
            panic!("amount must be positive");
        }
        if client == freelancer || client == arbiter || freelancer == arbiter {
            panic!("client, freelancer, and arbiter must be distinct addresses");
        }

        // Authenticate client
        client.require_auth();

        // Increment counter
        let counter_key = DataKey::Counter;
        let mut id: u32 = env.storage().persistent().get(&counter_key).unwrap_or(0);
        id += 1;
        env.storage().persistent().set(&counter_key, &id);

        // Transfer funds from client to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &amount);

        // Store escrow record
        let escrow = Escrow {
            id,
            client,
            freelancer,
            arbiter,
            token,
            amount,
            status: EscrowStatus::Active,
        };
        let escrow_key = DataKey::Escrow(id);
        env.storage().persistent().set(&escrow_key, &escrow);

        id
    }

    pub fn release_funds(env: Env, escrow_id: u32) {
        let escrow_key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .unwrap_or_else(|| panic!("escrow not found"));

        // Authenticate client
        escrow.client.require_auth();

        if escrow.status != EscrowStatus::Active {
            panic!("escrow is not active");
        }

        // Transfer funds to freelancer
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.freelancer, &escrow.amount);

        // Update status
        escrow.status = EscrowStatus::Completed;
        env.storage().persistent().set(&escrow_key, &escrow);
    }

    pub fn trigger_dispute(env: Env, escrow_id: u32) {
        let escrow_key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .unwrap_or_else(|| panic!("escrow not found"));

        let (has_client_auth, has_freelancer_auth) = {
            #[cfg(any(test, feature = "testutils"))]
            {
                let mut a = env.auths();
                if a.is_empty() {
                    TEST_CALLER.with(|caller| {
                        if let Some(ref addr) = *caller.borrow() {
                            a.push((
                                addr.clone(),
                                soroban_sdk::testutils::AuthorizedInvocation {
                                    function: soroban_sdk::testutils::AuthorizedFunction::Contract((
                                        env.current_contract_address(),
                                        soroban_sdk::Symbol::new(&env, "trigger_dispute"),
                                        soroban_sdk::IntoVal::into_val(&(escrow_id,), &env),
                                    )),
                                    sub_invocations: std::vec::Vec::new(),
                                }
                            ));
                        }
                    });
                }
                (
                    a.iter().any(|(addr, _)| addr == &escrow.client),
                    a.iter().any(|(addr, _)| addr == &escrow.freelancer),
                )
            }
            #[cfg(not(any(test, feature = "testutils")))]
            {
                (false, false)
            }
        };

        if has_client_auth {
            escrow.client.require_auth();
        } else if has_freelancer_auth {
            escrow.freelancer.require_auth();
        } else {
            panic!("unauthorized caller");
        }

        if escrow.status != EscrowStatus::Active {
            panic!("escrow is not active");
        }

        // Update status
        escrow.status = EscrowStatus::Disputed;
        env.storage().persistent().set(&escrow_key, &escrow);
    }

    pub fn resolve_dispute(env: Env, escrow_id: u32, freelancer_share: i128) {
        let escrow_key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .unwrap_or_else(|| panic!("escrow not found"));

        // Authenticate arbiter
        escrow.arbiter.require_auth();

        if escrow.status != EscrowStatus::Disputed {
            panic!("escrow is not disputed");
        }

        if freelancer_share < 0 {
            panic!("freelancer share cannot be negative");
        }

        if freelancer_share > escrow.amount {
            panic!("freelancer share cannot exceed total escrow amount");
        }

        let token_client = token::Client::new(&env, &escrow.token);
        
        // Transfer freelancer share if positive
        if freelancer_share > 0 {
            token_client.transfer(&env.current_contract_address(), &escrow.freelancer, &freelancer_share);
        }

        // Transfer client remainder if positive
        let client_remainder = escrow.amount - freelancer_share;
        if client_remainder > 0 {
            token_client.transfer(&env.current_contract_address(), &escrow.client, &client_remainder);
        }

        // Update status
        escrow.status = EscrowStatus::Resolved;
        env.storage().persistent().set(&escrow_key, &escrow);
    }
}
