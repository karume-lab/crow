use super::*;
use soroban_sdk::{Env, Address};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::token;

fn setup_test<'a>() -> (
    Env,
    Address, // client
    Address, // freelancer
    Address, // arbiter
    Address, // other
    Address, // token
    token::Client<'a>,
    token::StellarAssetClient<'a>,
    MicroEscrowContractClient<'a>,
) {
    let env = Env::default();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let other = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_client = token::Client::new(&env, &token_addr);
    let token_sac = token::StellarAssetClient::new(&env, &token_addr);

    // Register the escrow contract
    let contract_id = env.register_contract(None, MicroEscrowContract);
    let contract_client = MicroEscrowContractClient::new(&env, &contract_id);

    (
        env,
        client,
        freelancer,
        arbiter,
        other,
        token_addr,
        token_client,
        token_sac,
        contract_client,
    )
}

#[test]
fn test_happy_path() {
    let (env, client, freelancer, arbiter, _, token_addr, token_client, token_sac, contract_client) = setup_test();

    env.mock_all_auths();

    // Mint tokens to client
    let amount = 1000i128;
    token_sac.mint(&client, &amount);
    assert_eq!(token_client.balance(&client), amount);

    // Create escrow
    let escrow_id = contract_client.create_escrow(&client, &freelancer, &arbiter, &token_addr, &amount);
    assert_eq!(escrow_id, 1);

    // Verify balances
    assert_eq!(token_client.balance(&client), 0);
    assert_eq!(token_client.balance(&contract_client.address), amount);

    // Release funds
    contract_client.release_funds(&escrow_id);

    // Verify balance transfer
    assert_eq!(token_client.balance(&contract_client.address), 0);
    assert_eq!(token_client.balance(&freelancer), amount);
}

#[test]
fn test_dispute_and_resolution() {
    let (env, client, freelancer, arbiter, _, token_addr, token_client, token_sac, contract_client) = setup_test();

    env.mock_all_auths();

    let amount = 1000i128;
    token_sac.mint(&client, &amount);

    // Create escrow
    let escrow_id = contract_client.create_escrow(&client, &freelancer, &arbiter, &token_addr, &amount);

    // Trigger dispute
    contract_client.trigger_dispute(&client, &escrow_id);

    // Resolve dispute (arbiter splits 600 to freelancer, 400 to client)
    let freelancer_share = 600i128;
    contract_client.resolve_dispute(&escrow_id, &freelancer_share);

    // Verify balances
    assert_eq!(token_client.balance(&contract_client.address), 0);
    assert_eq!(token_client.balance(&freelancer), freelancer_share);
    assert_eq!(token_client.balance(&client), amount - freelancer_share);
}

#[test]
#[should_panic]
fn test_unauthorized_release() {
    let (env, client, freelancer, arbiter, _, token_addr, _, token_sac, contract_client) = setup_test();

    env.mock_all_auths();
    let amount = 1000i128;
    token_sac.mint(&client, &amount);
    let escrow_id = contract_client.create_escrow(&client, &freelancer, &arbiter, &token_addr, &amount);

    // Override mock_all_auths with empty auths list, causing require_auth to panic
    contract_client.mock_auths(&[]).release_funds(&escrow_id);
}

#[test]
#[should_panic]
fn test_unauthorized_resolve_dispute() {
    let (env, client, freelancer, arbiter, _, token_addr, _, token_sac, contract_client) = setup_test();

    env.mock_all_auths();
    let amount = 1000i128;
    token_sac.mint(&client, &amount);
    let escrow_id = contract_client.create_escrow(&client, &freelancer, &arbiter, &token_addr, &amount);

    // Trigger dispute
    contract_client.trigger_dispute(&client, &escrow_id);

    // Override mock_all_auths to cause resolve_dispute to fail as arbiter did not sign
    contract_client.mock_auths(&[]).resolve_dispute(&escrow_id, &500i128);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_create_escrow_invalid_amount() {
    let (env, client, freelancer, arbiter, _, token_addr, _, _, contract_client) = setup_test();
    env.mock_all_auths();
    contract_client.create_escrow(&client, &freelancer, &arbiter, &token_addr, &0i128);
}

#[test]
#[should_panic(expected = "client, freelancer, and arbiter must be distinct addresses")]
fn test_create_escrow_duplicate_addresses() {
    let (env, client, _, arbiter, _, token_addr, _, _, contract_client) = setup_test();
    env.mock_all_auths();
    contract_client.create_escrow(&client, &client, &arbiter, &token_addr, &1000i128);
}
