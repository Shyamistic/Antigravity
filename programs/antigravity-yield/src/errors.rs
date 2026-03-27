use anchor_lang::prelude::*;

#[error_code]
pub enum YieldError {
    #[msg("Insufficient balance for sweep.")]
    InsufficientBalance,
    #[msg("Unauthorized: Only the treasury authority can initiate sweeps.")]
    Unauthorized,
}
