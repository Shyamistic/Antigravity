use anchor_lang::prelude::*;

#[error_code]
pub enum AntigravityError {
    #[msg("Travel Rule violation: Transfer exceeds $3,000 and lacks Encrypted Identity Memo.")]
    TravelRuleViolation,
    #[msg("KYC Attestation not found or invalid for this account.")]
    KycNotVerified,
    #[msg("Compliance attestation has expired (exceeds 400ms/1-slot window).")]
    AttestationExpired,
    #[msg("Reentrancy detected in Transfer Hook.")]
    Reentrancy,
    #[msg("SIX BFI Gold price feed is stale or unavailable.")]
    PriceFeedStale,
    #[msg("Unauthorized: Only the Permanent Delegate or Treasury Authority can perform this action.")]
    Unauthorized,
    #[msg("KYC attestation has expired and requires renewal.")]
    KycExpired,
    #[msg("KYC attestation is suspended.")]
    KycSuspended,
    #[msg("KYC tier insufficient for this operation.")]
    InsufficientKycTier,
    #[msg("Risk rating prohibits this transaction.")]
    RiskRatingProhibited,
}
