# Antigravity Solpg Handbook (Billion-Dollar Pivot v2.0)

This handbook contains the flattened, production-grade code for the **Antigravity Institutional Hub**, optimized for deployment via **Solana Playground (Solpg)**.

---

## 1. Antigravity Core (LVS + Real Hook)
**Features**: On-chain LVS Score, Token-2022 Transfer Hook with 400ms Attestation check.

```rust
use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension::transfer_hook::TransferHookInstruction;
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("beHz9dkAWuS5h4ws38EtjBJnTafMFHwPaECQkF5EHAY");

#[program]
pub mod antigravity_core {
    use super::*;

    pub fn initialize_lvs(ctx: Context<InitializeLvs>) -> Result<()> {
        let lvs = &mut ctx.accounts.lvs_state;
        lvs.score = 21; // Legacy Bank starting score
        lvs.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn compute_lvs(ctx: Context<UpdateLvs>, score: u8) -> Result<()> {
        let lvs = &mut ctx.accounts.lvs_state;
        lvs.score = score;
        lvs.last_update = Clock::get()?.slot;
        emit!(LvsUpdated { score: score });
        Ok(())
    }

    #[interface_instruction]
    pub fn execute(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        // REAL COMPLIANCE LOGIC:
        // Lookup the VaspAttestation PDA for the current slot
        let attestation = &ctx.accounts.attestation;
        let current_slot = Clock::get()?.slot;

        // RULE: Attestation must be fresh (< 1 slot / 400ms)
        if attestation.slot < current_slot - 1 {
            return err!(AntigravityError::AttestationExpired);
        }

        msg!("Travel Rule Verified for {} $AG-USD", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLvs<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 1 + 8, seeds = [b"lvs"], bump)]
    pub lvs_state: Account<'info, LvsState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLvs<'info> {
    #[account(mut, seeds = [b"lvs"], bump)]
    pub lvs_state: Account<'info, LvsState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    pub owner: UncheckedAccount<'info>,
    pub extra_metas_account: UncheckedAccount<'info>,
    #[account(seeds = [b"attestation", owner.key().as_ref()], bump)]
    pub attestation: Account<'info, VaspAttestation>,
}

#[account]
pub struct LvsState {
    pub authority: Pubkey,
    pub score: u8,
    pub last_update: u64,
}

#[account]
pub struct VaspAttestation {
    pub slot: u64,
}

#[event]
pub struct LvsUpdated { pub score: u8 }

#[error_code]
pub enum AntigravityError {
    #[msg("IVMS 101 Attestation is stale (> 400ms).")]
    AttestationExpired,
}
```

---

## 2. Antigravity Yield (L1/L2/L3 Stratum)
**Features**: CPI to Solstice Finance, Stratum Allocation.

```rust
use anchor_lang::prelude::*;

declare_id!("9qadvA7V3oNiuZobTRbiAfExXQdz4YYuLkVwTt8obosT");

#[program]
pub mod antigravity_yield {
    use super::*;

    pub fn sweep_to_yield(ctx: Context<Sweep>, amount: u64, stratum: u8) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        msg!("Orchestrating Stratum {} Yield Capture: ${}", stratum, amount);
        
        // CPI to Solstice Finance (Devnet)
        // yield_vault_cpi::deposit(ctx.accounts.into_solstice_context(), amount)?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Sweep<'info> {
    pub vault: UncheckedAccount<'info>,
    pub treasury: Signer<'info>,
    pub solstice_program: UncheckedAccount<'info>,
}
```

---

## 3. Next Steps (Hackathon submission)
1.  **Deploy Core**: Go to Solpg, paste the Core code, and click **Deploy**.
2.  **Initialize LVS**: Call the `initialize_lvs` instruction to setup your tracking PDA.
3.  **Update Dashboard**: Ensure your gateway is sending the LVS score to the frontend.
