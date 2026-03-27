use anchor_lang::prelude::*;

#[account]
pub struct YieldVault {
    pub mint: Pubkey,
    pub idle_threshold: u64,
    pub target_vault: Pubkey, // Solstice eUSX vault
    pub authority: Pubkey,
    pub bump: u8,
}

impl YieldVault {
    pub const LEN: usize = 8 + 32 + 8 + 32 + 32 + 1;
}
