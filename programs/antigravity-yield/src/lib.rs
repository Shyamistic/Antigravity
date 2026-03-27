use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub mod errors;
pub mod state;

use crate::errors::YieldError;
use crate::state::*;

declare_id!("AntiGrv2222222222222222222222222222222222222");

#[program]
pub mod antigravity_yield {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        idle_threshold: u64,
        target_vault: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.mint = ctx.accounts.mint.key();
        vault.idle_threshold = idle_threshold;
        vault.target_vault = target_vault;
        vault.authority = ctx.accounts.authority.key();
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn sweep_to_yield(ctx: Context<Sweep>) -> Result<()> {
        let vault_balance = ctx.accounts.treasury_ata.amount;
        let threshold = ctx.accounts.vault.idle_threshold;

        if vault_balance <= threshold {
            return err!(YieldError::InsufficientBalance);
        }

        let amount_to_sweep = vault_balance - threshold;

        // CPI to route funds to Solstice YieldVault (eUSX)
        // For MVP, we'll perform a standard token transfer to the target vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_ata.to_account_info(),
            to: ctx.accounts.target_vault_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount_to_sweep)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = payer,
        space = YieldVault::LEN,
        seeds = [b"yield_vault", mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, YieldVault>,
    /// CHECK: The mint for which we are sweeping (e.g. USDC)
    pub mint: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Sweep<'info> {
    pub vault: Account<'info, YieldVault>,
    #[account(mut)]
    pub treasury_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub target_vault_ata: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
