#![no_std]

pub mod types;
pub mod contract;

pub use crate::types::{DataKey, Escrow, EscrowStatus};
pub use crate::contract::{MicroEscrowContract, MicroEscrowContractClient};

#[cfg(test)]
mod test;
