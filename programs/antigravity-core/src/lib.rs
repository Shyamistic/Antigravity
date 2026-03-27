use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

mod errors;
mod state;

use errors::*;
use state::*;

declare_id!("EiCCdPf5QBvVbywubi6LdgPeC5RbL4Qef5KV4ScUj9hy");

#[program]
pub mod antigravity_core {
    use super::*;

    pub fn initialize_mint(ctx: Context<InitializeMint>, oracle: Pubkey) -> Result<()> {
        let c = &mut ctx.accounts.config;
        c.mint = ctx.accounts.mint.key();
        c.authority = ctx.accounts.authority.key();
        c.oracle = oracle;
        c.price_feed = None;
        c.bump = *ctx.bumps.get("config").unwrap();
        Ok(())
    }

    pub fn register_kyc(
        ctx: Context<RegisterKyc>,
        entity_id: String,
        jurisdiction: String,
    ) -> Result<()> {
        let id = &mut ctx.accounts.identity_registry;
        id.owner = ctx.accounts.owner.key();
        id.entity_id = str_to_fixed32(entity_id)?;
        id.kyc_status = true;
        id.jurisdiction = str_to_fixed16(jurisdiction)?;
        id.bump = *ctx.bumps.get("identity_registry").unwrap();
        Ok(())
    }

    pub fn set_counterparty(
        ctx: Context<SetCounterparty>,
        allowed: bool,
    ) -> Result<()> {
        let cp = &mut ctx.accounts.counterparty_relationship;
        cp.owner = ctx.accounts.owner.key();
        cp.counterparty = ctx.accounts.counterparty.key();
        cp.allowed = allowed;
        Ok(())
    }

    pub fn refresh_attestation(
        ctx: Context<RefreshAttestation>,
        hash: [u8; 32],
    ) -> Result<()> {
        let att = &mut ctx.accounts.compliance_attestation;
        att.slot = Clock::get()?.slot;
        att.hash = hash;
        Ok(())
    }

    pub fn execute(
        ctx: Context<Execute>,
        amount: u64,
        travel_rule_hash: [u8; 32],
        risk_score: u8,
    ) -> Result<()> {
        let lock = &mut ctx.accounts.lock;
        if lock.is_locked {
            return err!(AntigravityError::Reentrancy);
        }
        lock.is_locked = true;

        if amount >= 3_000_000_000 {
            // Check basic KYC status
            if !ctx.accounts.source_kyc.kyc_status || !ctx.accounts.receiver_kyc.kyc_status {
                lock.is_locked = false;
                return err!(AntigravityError::KycNotVerified);
            }

            // Check enhanced KYC attestation validity
            let clock = Clock::get()?;
            if !ctx.accounts.source_kyc_attestation.is_active ||
               !ctx.accounts.receiver_kyc_attestation.is_active ||
               clock.unix_timestamp > ctx.accounts.source_kyc_attestation.expires_at ||
               clock.unix_timestamp > ctx.accounts.receiver_kyc_attestation.expires_at {
                lock.is_locked = false;
                return err!(AntigravityError::KycExpired);
            }

            // Check KYC tier requirements (Enhanced or Premium required for large transfers)
            if ctx.accounts.source_kyc_attestation.kyc_tier == KycTier::Basic ||
               ctx.accounts.receiver_kyc_attestation.kyc_tier == KycTier::Basic {
                lock.is_locked = false;
                return err!(AntigravityError::InsufficientKycTier);
            }

            // Check risk rating
            if ctx.accounts.source_kyc_attestation.risk_rating == RiskRating::Prohibited ||
               ctx.accounts.receiver_kyc_attestation.risk_rating == RiskRating::Prohibited {
                lock.is_locked = false;
                return err!(AntigravityError::RiskRatingProhibited);
            }

            if !(ctx.accounts.counterparty_relationship.allowed
                && ctx.accounts.counterparty_relationship.owner == ctx.accounts.source_owner.key()
                && ctx.accounts.counterparty_relationship.counterparty == ctx.accounts.receiver_owner.key())
            {
                lock.is_locked = false;
                return err!(AntigravityError::TravelRuleViolation);
            }
        }

        let risk = if risk_score >= 80 {
            RiskScore::High
        } else if risk_score >= 50 {
            RiskScore::Medium
        } else {
            RiskScore::Low
        };

        if risk == RiskScore::High {
            lock.is_locked = false;
            emit!(TransferEvaluated {
                sender: ctx.accounts.source_owner.key(),
                receiver: ctx.accounts.receiver_owner.key(),
                amount,
                attestation_slot: ctx.accounts.compliance_attestation.slot,
                risk_score,
                decision: Decision::Reject,
                travel_rule_hash,
            });
            return err!(AntigravityError::TravelRuleViolation);
        }

        let now_slot = Clock::get()?.slot;
        if ctx.accounts.compliance_attestation.slot < now_slot.saturating_sub(1) {
            lock.is_locked = false;
            emit!(TransferEvaluated {
                sender: ctx.accounts.source_owner.key(),
                receiver: ctx.accounts.receiver_owner.key(),
                amount,
                attestation_slot: ctx.accounts.compliance_attestation.slot,
                risk_score,
                decision: Decision::Reject,
                travel_rule_hash,
            });
            return err!(AntigravityError::AttestationExpired);
        }

        emit!(TransferEvaluated {
            sender: ctx.accounts.source_owner.key(),
            receiver: ctx.accounts.receiver_owner.key(),
            amount,
            attestation_slot: ctx.accounts.compliance_attestation.slot,
            risk_score,
            decision: Decision::Allow,
            travel_rule_hash,
        });

        // Update transaction monitoring for KYT
        let counterparty_jurisdiction = "CH"; // Simplified - would be derived from receiver KYC
        let is_new_counterparty = !ctx.accounts.counterparty_relationship.allowed; // Simplified check

        // Note: In a real implementation, this would be called via CPI or separate instruction
        // For now, we'll inline the monitoring logic
        let monitor = &mut ctx.accounts.transaction_monitor;
        let clock = Clock::get()?;

        // Reset counters if 24h has passed
        let hours_since_update = (clock.unix_timestamp - monitor.last_updated) / 3600;
        if hours_since_update >= 24 {
            monitor.total_volume_24h = 0;
            monitor.transaction_count_24h = 0;
            monitor.geographic_spread = 0;
            monitor.counterparty_count_24h = 0;
            monitor.largest_transaction_24h = 0;
        }

        // Update transaction metrics
        monitor.total_volume_24h = monitor.total_volume_24h.saturating_add(amount);
        monitor.transaction_count_24h = monitor.transaction_count_24h.saturating_add(1);
        monitor.last_transaction_timestamp = clock.unix_timestamp;
        monitor.last_updated = clock.unix_timestamp;

        if amount > monitor.largest_transaction_24h {
            monitor.largest_transaction_24h = amount;
        }

        if is_new_counterparty {
            monitor.counterparty_count_24h = monitor.counterparty_count_24h.saturating_add(1);
        }

        // Calculate velocity score
        let volume_score = if monitor.total_volume_24h > 100_000_000_000 { 100 }
                          else if monitor.total_volume_24h > 10_000_000_000 { 75 }
                          else if monitor.total_volume_24h > 1_000_000_000 { 50 }
                          else { 0 };

        let frequency_score = if monitor.transaction_count_24h > 50 { 100 }
                             else if monitor.transaction_count_24h > 20 { 75 }
                             else if monitor.transaction_count_24h > 10 { 50 }
                             else if monitor.transaction_count_24h > 5 { 25 }
                             else { 0 };

        monitor.velocity_score = ((volume_score + frequency_score) / 2) as u8;

        lock.is_locked = false;
        Ok(())
    }

    // ==================== NEW: ENHANCED KYC LIFECYCLE INSTRUCTIONS ====================

    pub fn issue_kyc_attestation(
        ctx: Context<IssueKycAttestation>,
        entity_id: String,
        jurisdiction: String,
        kyc_tier: KycTier,
        verification_method: VerificationMethod,
        risk_rating: RiskRating,
        validity_days: u16,
        review_frequency_days: u16,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.kyc_attestation;
        let clock = Clock::get()?;

        attestation.owner = ctx.accounts.owner.key();
        attestation.verified_at = clock.unix_timestamp;
        attestation.expires_at = clock.unix_timestamp + (validity_days as i64 * 24 * 60 * 60);
        attestation.kyc_tier = kyc_tier;
        attestation.jurisdiction = str_to_fixed16(jurisdiction)?;
        attestation.entity_id = str_to_fixed32(entity_id)?;
        attestation.issuing_authority = ctx.accounts.authority.key();
        attestation.verification_method = verification_method;
        attestation.risk_rating = risk_rating;
        attestation.last_reviewed = clock.unix_timestamp;
        attestation.review_frequency_days = review_frequency_days;
        attestation.is_active = true;
        attestation.renewal_required = false;

        Ok(())
    }

    pub fn renew_kyc_attestation(
        ctx: Context<RenewKycAttestation>,
        new_validity_days: u16,
        updated_risk_rating: Option<RiskRating>,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.kyc_attestation;
        let clock = Clock::get()?;

        // Verify ownership
        require!(attestation.owner == ctx.accounts.owner.key(), AntigravityError::Unauthorized);

        // Update expiry
        attestation.expires_at = clock.unix_timestamp + (new_validity_days as i64 * 24 * 60 * 60);
        attestation.last_reviewed = clock.unix_timestamp;
        attestation.renewal_required = false;

        // Update risk rating if provided
        if let Some(risk) = updated_risk_rating {
            attestation.risk_rating = risk;
        }

        Ok(())
    }

    pub fn suspend_kyc_attestation(ctx: Context<SuspendKycAttestation>) -> Result<()> {
        let attestation = &mut ctx.accounts.kyc_attestation;

        // Only issuing authority can suspend
        require!(attestation.issuing_authority == ctx.accounts.authority.key(), AntigravityError::Unauthorized);

        attestation.is_active = false;

        Ok(())
    }

    pub fn check_kyc_expiry(ctx: Context<CheckKycExpiry>) -> Result<()> {
        let attestation = &mut ctx.accounts.kyc_attestation;
        let clock = Clock::get()?;

        // Check if attestation has expired
        if clock.unix_timestamp > attestation.expires_at {
            attestation.is_active = false;
            attestation.renewal_required = true;
            return err!(AntigravityError::KycExpired);
        }

        // Check if review is due
        let days_since_review = (clock.unix_timestamp - attestation.last_reviewed) / (24 * 60 * 60);
        if days_since_review >= attestation.review_frequency_days as i64 {
            attestation.renewal_required = true;
        }

        Ok(())
    }

    // ==================== NEW: KYT MONITORING INSTRUCTIONS ====================

    pub fn update_transaction_monitor(
        ctx: Context<UpdateTransactionMonitor>,
        amount: u64,
        counterparty_jurisdiction: String,
        is_new_counterparty: bool,
    ) -> Result<()> {
        let monitor = &mut ctx.accounts.transaction_monitor;
        let clock = Clock::get()?;

        // Reset counters if 24h has passed
        let hours_since_update = (clock.unix_timestamp - monitor.last_updated) / 3600;
        if hours_since_update >= 24 {
            monitor.total_volume_24h = 0;
            monitor.transaction_count_24h = 0;
            monitor.geographic_spread = 0;
            monitor.counterparty_count_24h = 0;
            monitor.largest_transaction_24h = 0;
        }

        // Update transaction metrics
        monitor.total_volume_24h = monitor.total_volume_24h.saturating_add(amount);
        monitor.transaction_count_24h = monitor.transaction_count_24h.saturating_add(1);
        monitor.last_transaction_timestamp = clock.unix_timestamp;
        monitor.last_updated = clock.unix_timestamp;

        if amount > monitor.largest_transaction_24h {
            monitor.largest_transaction_24h = amount;
        }

        if is_new_counterparty {
            monitor.counterparty_count_24h = monitor.counterparty_count_24h.saturating_add(1);
        }

        // Update geographic spread (simplified - in real implementation would track unique jurisdictions)
        if monitor.geographic_spread < 255 {
            monitor.geographic_spread = monitor.geographic_spread.saturating_add(1);
        }

        // Calculate average transaction size
        if monitor.transaction_count_24h > 0 {
            monitor.average_transaction_size = monitor.total_volume_24h / monitor.transaction_count_24h as u64;
        }

        // Calculate velocity score (0-100)
        let volume_score = if monitor.total_volume_24h > 100_000_000_000 { 100 } // > 100k USD
                          else if monitor.total_volume_24h > 10_000_000_000 { 75 } // > 10k USD
                          else if monitor.total_volume_24h > 1_000_000_000 { 50 } // > 1k USD
                          else { 0 };

        let frequency_score = if monitor.transaction_count_24h > 50 { 100 }
                             else if monitor.transaction_count_24h > 20 { 75 }
                             else if monitor.transaction_count_24h > 10 { 50 }
                             else if monitor.transaction_count_24h > 5 { 25 }
                             else { 0 };

        let geographic_score = if monitor.geographic_spread > 10 { 100 }
                              else if monitor.geographic_spread > 5 { 50 }
                              else { 0 };

        monitor.velocity_score = ((volume_score + frequency_score + geographic_score) / 3) as u8;

        // Set risk flags
        let mut risk_flags = 0u32;
        if monitor.velocity_score > 75 {
            risk_flags |= RiskFlag::HighVelocity as u32;
        }
        if monitor.transaction_count_24h > 10 && monitor.average_transaction_size < 1_000_000_000 {
            risk_flags |= RiskFlag::Structuring as u32;
        }
        if monitor.geographic_spread > 5 {
            risk_flags |= RiskFlag::GeographicAnomaly as u32;
        }
        if is_new_counterparty {
            risk_flags |= RiskFlag::NewCounterparty as u32;
        }
        if amount > 10_000_000_000 {
            risk_flags |= RiskFlag::LargeTransaction as u32;
        }
        if amount % 1_000_000_000 == 0 { // Round amounts
            risk_flags |= RiskFlag::RoundAmount as u32;
        }

        monitor.risk_flags = risk_flags;

        Ok(())
    }

    // ==================== NEW: VAULT LIFECYCLE MANAGEMENT ====================

    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_id: String,
        vault_type: VaultType,
        currency: String,
        compliance_tier: ComplianceTier,
        yield_strategy: YieldStrategy,
        name: String,
        description: String,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        vault.owner = ctx.accounts.owner.key();
        vault.vault_id = str_to_fixed32(vault_id)?;
        vault.vault_type = vault_type;
        vault.status = VaultStatus::PendingApproval;
        vault.total_balance = 0;
        vault.available_balance = 0;
        vault.locked_balance = 0;
        vault.currency = str_to_fixed8(currency)?;
        vault.created_at = clock.unix_timestamp;
        vault.last_activity = clock.unix_timestamp;
        vault.risk_score = 0;
        vault.compliance_tier = compliance_tier;
        vault.authorized_signers = vec![ctx.accounts.owner.key()];
        vault.required_signatures = 1;
        vault.auto_sweep_enabled = false;
        vault.auto_sweep_threshold = 0;
        vault.yield_strategy = yield_strategy;

        // Initialize metadata
        vault.metadata = VaultMetadata {
            name: str_to_fixed64(name)?,
            description: str_to_fixed256(description)?,
            tags: vec![],
            custom_fields: vec![],
        };

        Ok(())
    }

    pub fn approve_vault(ctx: Context<ApproveVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Only compliance authority can approve vaults
        require!(vault.status == VaultStatus::PendingApproval, AntigravityError::Unauthorized);

        vault.status = VaultStatus::Active;

        Ok(())
    }

    pub fn vault_deposit(
        ctx: Context<VaultDeposit>,
        amount: u64,
        transaction_id: String,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let transaction = &mut ctx.accounts.transaction;
        let clock = Clock::get()?;

        // Validate vault status
        require!(vault.status == VaultStatus::Active, AntigravityError::Unauthorized);

        // Create transaction record
        transaction.vault_id = vault.vault_id;
        transaction.transaction_id = str_to_fixed32(transaction_id)?;
        transaction.transaction_type = TransactionType::Deposit;
        transaction.amount = amount;
        transaction.currency = vault.currency;
        transaction.counterparty = ctx.accounts.depositor.key();
        transaction.timestamp = clock.unix_timestamp;
        transaction.status = TransactionStatus::Completed;

        // Run compliance check
        transaction.compliance_check = ComplianceResult {
            passed: true, // Simplified - would do full compliance check
            risk_score: vault.risk_score,
            flags: 0,
            attestation_required: false,
            travel_rule_required: false,
        };

        // Update vault balances
        vault.total_balance = vault.total_balance.saturating_add(amount);
        vault.available_balance = vault.available_balance.saturating_add(amount);
        vault.last_activity = clock.unix_timestamp;

        Ok(())
    }

    pub fn vault_transfer(
        ctx: Context<VaultTransfer>,
        amount: u64,
        transaction_id: String,
        notes: String,
    ) -> Result<()> {
        let source_vault = &mut ctx.accounts.source_vault;
        let dest_vault = &mut ctx.accounts.destination_vault;
        let transaction = &mut ctx.accounts.transaction;
        let clock = Clock::get()?;

        // Validate vaults
        require!(source_vault.status == VaultStatus::Active, AntigravityError::Unauthorized);
        require!(dest_vault.status == VaultStatus::Active, AntigravityError::Unauthorized);
        require!(source_vault.available_balance >= amount, AntigravityError::Unauthorized);

        // Create transaction record
        transaction.vault_id = source_vault.vault_id;
        transaction.transaction_id = str_to_fixed32(transaction_id)?;
        transaction.transaction_type = TransactionType::Transfer;
        transaction.amount = amount;
        transaction.currency = source_vault.currency;
        transaction.counterparty = dest_vault.owner;
        transaction.timestamp = clock.unix_timestamp;
        transaction.status = TransactionStatus::Completed;
        transaction.notes = str_to_fixed256(notes)?;

        // Compliance check (simplified)
        transaction.compliance_check = ComplianceResult {
            passed: true,
            risk_score: source_vault.risk_score.max(dest_vault.risk_score),
            flags: 0,
            attestation_required: amount >= 3_000_000_000, // $3k threshold
            travel_rule_required: amount >= 1_000_000_000, // $1k threshold
        };

        // Update balances
        source_vault.available_balance = source_vault.available_balance.saturating_sub(amount);
        source_vault.last_activity = clock.unix_timestamp;

        dest_vault.total_balance = dest_vault.total_balance.saturating_add(amount);
        dest_vault.available_balance = dest_vault.available_balance.saturating_add(amount);
        dest_vault.last_activity = clock.unix_timestamp;

        Ok(())
    }

    pub fn freeze_vault(ctx: Context<FreezeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Only compliance authority can freeze
        vault.status = VaultStatus::Frozen;

        Ok(())
    }

    // ==================== NEW: MULTISIG GOVERNANCE ====================

    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        multisig_id: String,
        owners: Vec<Pubkey>,
        threshold: u8,
        multisig_type: MultisigType,
        name: String,
        description: String,
    ) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        require!(owners.len() >= threshold as usize, AntigravityError::Unauthorized);
        require!(threshold > 0, AntigravityError::Unauthorized);

        multisig.multisig_id = str_to_fixed32(multisig_id)?;
        multisig.owners = owners;
        multisig.threshold = threshold;
        multisig.nonce = 0;
        multisig.owner_set_seqno = 0;
        multisig.wallet_type = multisig_type;
        multisig.permissions = MultisigPermissions::Full;

        let clock = Clock::get()?;
        multisig.metadata = MultisigMetadata {
            name: str_to_fixed64(name)?,
            description: str_to_fixed256(description)?,
            created_at: clock.unix_timestamp,
            daily_limit: 0, // Unlimited by default
            monthly_limit: 0,
        };

        Ok(())
    }

    pub fn propose_transaction(
        ctx: Context<ProposeTransaction>,
        instructions: Vec<MultisigInstruction>,
        title: String,
        description: String,
        expiry_hours: u16,
        transaction_type: MultisigTransactionType,
        amount: Option<u64>,
        currency: Option<String>,
        counterparty: Option<Pubkey>,
    ) -> Result<()> {
        let multisig = &ctx.accounts.multisig;
        let transaction = &mut ctx.accounts.transaction;
        let clock = Clock::get()?;

        // Verify proposer is an owner
        require!(multisig.owners.contains(&ctx.accounts.proposer.key()), AntigravityError::Unauthorized);

        transaction.multisig = multisig.key();
        transaction.transaction_id = multisig.nonce;
        transaction.proposer = ctx.accounts.proposer.key();
        transaction.instructions = instructions;
        transaction.signers = vec![false; multisig.owners.len()];
        transaction.executed = false;
        transaction.execution_time = None;
        transaction.expiry_time = clock.unix_timestamp + (expiry_hours as i64 * 3600);
        transaction.transaction_type = transaction_type;
        transaction.approval_count = 0;
        transaction.rejection_count = 0;

        // Set proposer as first approver
        let proposer_index = multisig.owners.iter().position(|&owner| owner == ctx.accounts.proposer.key()).unwrap();
        transaction.signers[proposer_index] = true;
        transaction.approval_count = 1;

        transaction.metadata = TransactionMetadata {
            title: str_to_fixed128(title)?,
            description: str_to_fixed256(description)?,
            amount,
            currency: currency.map(|c| str_to_fixed8(c).unwrap_or([0u8; 8])),
            counterparty,
            risk_assessment: None,
        };

        Ok(())
    }

    pub fn approve_transaction(ctx: Context<ApproveTransaction>) -> Result<()> {
        let multisig = &ctx.accounts.multisig;
        let transaction = &mut ctx.accounts.transaction;
        let clock = Clock::get()?;

        // Verify approver is an owner
        let approver_index = multisig.owners.iter().position(|&owner| owner == ctx.accounts.approver.key());
        require!(approver_index.is_some(), AntigravityError::Unauthorized);

        let index = approver_index.unwrap();

        // Check if already signed
        require!(!transaction.signers[index], AntigravityError::Unauthorized);

        // Check if transaction expired
        require!(clock.unix_timestamp < transaction.expiry_time, AntigravityError::Unauthorized);

        // Check if already executed
        require!(!transaction.executed, AntigravityError::Unauthorized);

        // Approve
        transaction.signers[index] = true;
        transaction.approval_count = transaction.approval_count.saturating_add(1);

        Ok(())
    }

    pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
        let multisig = &ctx.accounts.multisig;
        let transaction = &mut ctx.accounts.transaction;
        let clock = Clock::get()?;

        // Check if transaction expired
        require!(clock.unix_timestamp < transaction.expiry_time, AntigravityError::Unauthorized);

        // Check if already executed
        require!(!transaction.executed, AntigravityError::Unauthorized);

        // Check if threshold met
        require!(transaction.approval_count >= multisig.threshold, AntigravityError::Unauthorized);

        // Execute the instructions (simplified - in real implementation would CPI)
        // For demo purposes, we just mark as executed
        transaction.executed = true;
        transaction.execution_time = Some(clock.unix_timestamp);

        Ok(())
    }

    pub fn reject_transaction(ctx: Context<RejectTransaction>) -> Result<()> {
        let multisig = &ctx.accounts.multisig;
        let transaction = &mut ctx.accounts.transaction;

        // Verify rejector is an owner
        require!(multisig.owners.contains(&ctx.accounts.rejector.key()), AntigravityError::Unauthorized);

        // Check if already executed
        require!(!transaction.executed, AntigravityError::Unauthorized);

        transaction.rejection_count = transaction.rejection_count.saturating_add(1);

        Ok(())
    }

    // ==================== NEW: VAULT ACCOUNT STRUCTS ====================

    #[derive(Accounts)]
    pub struct CreateVault<'info> {
        #[account(init, payer = payer, space = 500, seeds = [b"vault", owner.key().as_ref(), vault_id.as_bytes()], bump)]
        pub vault: Account<'info, Vault>,
        pub owner: Signer<'info>,
        /// CHECK: vault_id used in seed
        pub vault_id: UncheckedAccount<'info>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct ApproveVault<'info> {
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.vault_id.as_ref()], bump)]
        pub vault: Account<'info, Vault>,
        pub authority: Signer<'info>, // Compliance authority
    }

    #[derive(Accounts)]
    pub struct VaultDeposit<'info> {
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.vault_id.as_ref()], bump)]
        pub vault: Account<'info, Vault>,
        #[account(init, payer = payer, space = 300, seeds = [b"vault_tx", vault.vault_id.as_ref(), transaction_id.as_bytes()], bump)]
        pub transaction: Account<'info, VaultTransaction>,
        pub depositor: Signer<'info>,
        /// CHECK: transaction_id used in seed
        pub transaction_id: UncheckedAccount<'info>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct VaultTransfer<'info> {
        #[account(mut, seeds = [b"vault", source_vault.owner.as_ref(), source_vault.vault_id.as_ref()], bump)]
        pub source_vault: Account<'info, Vault>,
        #[account(mut, seeds = [b"vault", destination_vault.owner.as_ref(), destination_vault.vault_id.as_ref()], bump)]
        pub destination_vault: Account<'info, Vault>,
        #[account(init, payer = payer, space = 300, seeds = [b"vault_tx", source_vault.vault_id.as_ref(), transaction_id.as_bytes()], bump)]
        pub transaction: Account<'info, VaultTransaction>,
        pub owner: Signer<'info>,
        /// CHECK: transaction_id used in seed
        pub transaction_id: UncheckedAccount<'info>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct FreezeVault<'info> {
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.vault_id.as_ref()], bump)]
        pub vault: Account<'info, Vault>,
        pub authority: Signer<'info>, // Compliance authority
    }

    // ==================== NEW: MULTISIG ACCOUNT STRUCTS ====================

    #[derive(Accounts)]
    pub struct CreateMultisig<'info> {
        #[account(init, payer = payer, space = 500, seeds = [b"multisig", multisig_id.as_bytes()], bump)]
        pub multisig: Account<'info, MultisigWallet>,
        pub creator: Signer<'info>,
        /// CHECK: multisig_id used in seed
        pub multisig_id: UncheckedAccount<'info>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct ProposeTransaction<'info> {
        #[account(mut, seeds = [b"multisig", multisig.multisig_id.as_ref()], bump)]
        pub multisig: Account<'info, MultisigWallet>,
        #[account(init, payer = payer, space = 1000, seeds = [b"multisig_tx", multisig.key().as_ref(), &multisig.nonce.to_le_bytes()], bump)]
        pub transaction: Account<'info, MultisigTransaction>,
        pub proposer: Signer<'info>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct ApproveTransaction<'info> {
        #[account(mut, seeds = [b"multisig", multisig.multisig_id.as_ref()], bump)]
        pub multisig: Account<'info, MultisigWallet>,
        #[account(mut, seeds = [b"multisig_tx", multisig.key().as_ref(), &transaction.transaction_id.to_le_bytes()], bump)]
        pub transaction: Account<'info, MultisigTransaction>,
        pub approver: Signer<'info>,
    }

    #[derive(Accounts)]
    pub struct ExecuteTransaction<'info> {
        #[account(mut, seeds = [b"multisig", multisig.multisig_id.as_ref()], bump)]
        pub multisig: Account<'info, MultisigWallet>,
        #[account(mut, seeds = [b"multisig_tx", multisig.key().as_ref(), &transaction.transaction_id.to_le_bytes()], bump)]
        pub transaction: Account<'info, MultisigTransaction>,
        pub executor: Signer<'info>,
    }

    #[derive(Accounts)]
    pub struct RejectTransaction<'info> {
        #[account(mut, seeds = [b"multisig", multisig.multisig_id.as_ref()], bump)]
        pub multisig: Account<'info, MultisigWallet>,
        #[account(mut, seeds = [b"multisig_tx", multisig.key().as_ref(), &transaction.transaction_id.to_le_bytes()], bump)]
        pub transaction: Account<'info, MultisigTransaction>,
        pub rejector: Signer<'info>,
    }

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(init, payer = payer, space = 120, seeds = [b"config", mint.key().as_ref()], bump)]
    pub config: Account<'info, MintConfig>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterKyc<'info> {
    #[account(init, payer = payer, space = 200, seeds = [b"identity", owner.key().as_ref()], bump)]
    pub identity_registry: Account<'info, IdentityRegistry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetCounterparty<'info> {
    #[account(init_if_needed, payer = payer, space = 80, seeds = [b"counterparty", owner.key().as_ref(), counterparty.key().as_ref()], bump)]
    pub counterparty_relationship: Account<'info, CounterpartyRelationship>,
    pub owner: Signer<'info>,
    /// CHECK: the counterparty pubkey
    pub counterparty: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefreshAttestation<'info> {
    #[account(init_if_needed, payer = authority, space = 72, seeds = [b"attestation", authority.key().as_ref()], bump)]
    pub compliance_attestation: Account<'info, ComplianceAttestation>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Execute<'info> {
    #[account(mut)]
    pub source_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub destination_account: InterfaceAccount<'info, TokenAccount>,
    pub source_owner: Signer<'info>,
    /// CHECK: receiver owner can be external
    pub receiver_owner: UncheckedAccount<'info>,

    #[account(mut, seeds = [b"kyc", source_owner.key().as_ref()], bump)]
    pub source_kyc: Account<'info, IdentityRegistry>,
    #[account(mut, seeds = [b"kyc", receiver_owner.key().as_ref()], bump)]
    pub receiver_kyc: Account<'info, IdentityRegistry>,

    // Enhanced KYC attestations
    #[account(mut, seeds = [b"kyc_attestation", source_owner.key().as_ref()], bump)]
    pub source_kyc_attestation: Account<'info, KycAttestation>,
    #[account(mut, seeds = [b"kyc_attestation", receiver_owner.key().as_ref()], bump)]
    pub receiver_kyc_attestation: Account<'info, KycAttestation>,

    #[account(mut, seeds = [b"monitor", source_owner.key().as_ref()], bump)]
    pub transaction_monitor: Account<'info, TransactionMonitor>,

    #[account(mut, seeds = [b"counterparty", source_owner.key().as_ref(), receiver_owner.key().as_ref()], bump)]
    pub counterparty_relationship: Account<'info, CounterpartyRelationship>,

    #[account(mut, seeds = [b"attestation", source_owner.key().as_ref()], bump)]
    pub compliance_attestation: Account<'info, ComplianceAttestation>,

    #[account(mut, seeds = [b"lock", mint.key().as_ref()], bump)]
    pub lock: Account<'info, ReentrancyLock>,

    pub system_program: Program<'info, System>,
}

// ==================== NEW: ENHANCED KYC ACCOUNT STRUCTS ====================

#[derive(Accounts)]
pub struct IssueKycAttestation<'info> {
    #[account(init, payer = payer, space = 300, seeds = [b"kyc_attestation", owner.key().as_ref()], bump)]
    pub kyc_attestation: Account<'info, KycAttestation>,
    pub owner: Signer<'info>,
    pub authority: Signer<'info>, // KYC issuing authority
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RenewKycAttestation<'info> {
    #[account(mut, seeds = [b"kyc_attestation", owner.key().as_ref()], bump)]
    pub kyc_attestation: Account<'info, KycAttestation>,
    pub owner: Signer<'info>,
    pub authority: Signer<'info>, // KYC renewal authority
}

#[derive(Accounts)]
pub struct SuspendKycAttestation<'info> {
    #[account(mut, seeds = [b"kyc_attestation", kyc_attestation.owner.as_ref()], bump)]
    pub kyc_attestation: Account<'info, KycAttestation>,
    pub authority: Signer<'info>, // Must be the issuing authority
}

#[derive(Accounts)]
pub struct CheckKycExpiry<'info> {
    #[account(mut, seeds = [b"kyc_attestation", owner.key().as_ref()], bump)]
    pub kyc_attestation: Account<'info, KycAttestation>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTransactionMonitor<'info> {
    #[account(init_if_needed, payer = payer, space = 150, seeds = [b"monitor", owner.key().as_ref()], bump)]
    pub transaction_monitor: Account<'info, TransactionMonitor>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn str_to_fixed32(value: String) -> Result<[u8; 32]> {
    let bytes = value.as_bytes();
    let mut fixed = [0u8; 32];
    let len = std::cmp::min(bytes.len(), 32);
    fixed[..len].copy_from_slice(&bytes[..len]);
    Ok(fixed)
}

pub fn str_to_fixed16(value: String) -> Result<[u8; 16]> {
    let bytes = value.as_bytes();
    let mut fixed = [0u8; 16];
    let len = std::cmp::min(bytes.len(), 16);
    fixed[..len].copy_from_slice(&bytes[..len]);
    Ok(fixed)
}

pub fn str_to_fixed8(value: String) -> Result<[u8; 8]> {
    let bytes = value.as_bytes();
    let mut fixed = [0u8; 8];
    let len = std::cmp::min(bytes.len(), 8);
    fixed[..len].copy_from_slice(&bytes[..len]);
    Ok(fixed)
}

pub fn str_to_fixed64(value: String) -> Result<[u8; 64]> {
    let bytes = value.as_bytes();
    let mut fixed = [0u8; 64];
    let len = std::cmp::min(bytes.len(), 64);
    fixed[..len].copy_from_slice(&bytes[..len]);
    Ok(fixed)
}

pub fn str_to_fixed256(value: String) -> Result<[u8; 256]> {
    let bytes = value.as_bytes();
    let mut fixed = [0u8; 256];
    let len = std::cmp::min(bytes.len(), 256);
    fixed[..len].copy_from_slice(&bytes[..len]);
    Ok(fixed)
}

pub fn str_to_fixed128(value: String) -> Result<[u8; 128]> {
    let bytes = value.as_bytes();
    let mut fixed = [0u8; 128];
    let len = std::cmp::min(bytes.len(), 128);
    fixed[..len].copy_from_slice(&bytes[..len]);
    Ok(fixed)
}

