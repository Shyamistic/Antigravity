use anchor_lang::prelude::*;

#[account]
pub struct MintConfig {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub oracle: Pubkey,
    pub price_feed: Option<Pubkey>,
    pub bump: u8,
}

#[account]
pub struct IdentityRegistry {
    pub owner: Pubkey,
    pub entity_id: [u8; 32],
    pub kyc_status: bool,
    pub jurisdiction: [u8; 16],
    pub bump: u8,
}

#[account]
pub struct KycAttestation {
    pub owner: Pubkey,
    pub verified_at: i64,
    pub expires_at: i64,
    pub kyc_tier: KycTier,
    pub jurisdiction: [u8; 16],
    pub entity_id: [u8; 32],
    pub issuing_authority: Pubkey,
    pub verification_method: VerificationMethod,
    pub risk_rating: RiskRating,
    pub last_reviewed: i64,
    pub review_frequency_days: u16,
    pub is_active: bool,
    pub renewal_required: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum KycTier {
    Basic,      // Email/phone verification only
    Standard,   // ID document verification
    Enhanced,   // Enhanced due diligence (EDD)
    Premium,    // Full KYC with biometric/face verification
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VerificationMethod {
    DocumentScan,
    Biometric,
    ThirdPartyAttestation,
    ManualReview,
    AiAutomated,
}

#[account]
pub struct TransactionMonitor {
    pub owner: Pubkey,
    pub total_volume_24h: u64,
    pub transaction_count_24h: u32,
    pub last_transaction_timestamp: i64,
    pub velocity_score: u8, // 0-100, higher = more suspicious
    pub geographic_spread: u8, // Number of different jurisdictions in 24h
    pub counterparty_count_24h: u32,
    pub average_transaction_size: u64,
    pub largest_transaction_24h: u64,
    pub risk_flags: u32, // Bitfield for different risk indicators
    pub last_updated: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RiskFlag {
    HighVelocity = 1 << 0,
    Structuring = 1 << 1,
    GeographicAnomaly = 1 << 2,
    NewCounterparty = 1 << 3,
    LargeTransaction = 1 << 4,
    RoundAmount = 1 << 5,
    UnusualTiming = 1 << 6,
    SanctionsExposure = 1 << 7,
}

// ==================== NEW: VAULT LIFECYCLE MANAGEMENT ====================

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub vault_id: [u8; 32],
    pub vault_type: VaultType,
    pub status: VaultStatus,
    pub total_balance: u64,
    pub available_balance: u64,
    pub locked_balance: u64,
    pub currency: [u8; 8], // USD, CHF, EUR, etc.
    pub created_at: i64,
    pub last_activity: i64,
    pub risk_score: u8,
    pub compliance_tier: ComplianceTier,
    pub authorized_signers: Vec<Pubkey>, // For multisig
    pub required_signatures: u8,
    pub auto_sweep_enabled: bool,
    pub auto_sweep_threshold: u64,
    pub yield_strategy: YieldStrategy,
    pub metadata: VaultMetadata,
}

#[account]
pub struct VaultTransaction {
    pub vault_id: [u8; 32],
    pub transaction_id: [u8; 32],
    pub transaction_type: TransactionType,
    pub amount: u64,
    pub currency: [u8; 8],
    pub counterparty: Pubkey,
    pub timestamp: i64,
    pub status: TransactionStatus,
    pub compliance_check: ComplianceResult,
    pub fx_rate: Option<u64>, // For cross-border
    pub notes: [u8; 256], // Transaction notes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VaultType {
    HotWallet,      // High-frequency trading wallet
    ColdStorage,    // Long-term holding
    Settlement,     // Payment settlement account
    Treasury,       // Corporate treasury
    Nostro,         // Bank correspondent account
    Yield,          // DeFi yield farming
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VaultStatus {
    Active,
    Frozen,
    Suspended,
    Closed,
    PendingApproval,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ComplianceTier {
    Basic,      // Standard KYC required
    Enhanced,   // Enhanced due diligence
    Premium,    // Full compliance + monitoring
    Institutional, // Bank-grade compliance
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum YieldStrategy {
    None,
    Conservative,   // Low-risk staking
    Balanced,       // Mixed yield farming
    Aggressive,     // High-yield DeFi strategies
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TransactionType {
    Deposit,
    Withdrawal,
    Transfer,
    Settlement,
    YieldClaim,
    FeePayment,
    ComplianceFee,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TransactionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Rejected,
    Reversed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VaultMetadata {
    pub name: [u8; 64],
    pub description: [u8; 256],
    pub tags: Vec<[u8; 32]>, // Compliance tags, risk categories, etc.
    pub custom_fields: Vec<VaultCustomField>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VaultCustomField {
    pub key: [u8; 32],
    pub value: [u8; 128],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub struct ComplianceResult {
    pub passed: bool,
    pub risk_score: u8,
    pub flags: u32, // Bitfield of compliance flags
    pub attestation_required: bool,
    pub travel_rule_required: bool,
}
// ==================== NEW: MULTISIG GOVERNANCE ====================

#[account]
pub struct MultisigWallet {
    pub multisig_id: [u8; 32],
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
    pub nonce: u64,
    pub owner_set_seqno: u32,
    pub wallet_type: MultisigType,
    pub permissions: MultisigPermissions,
    pub metadata: MultisigMetadata,
}

#[account]
pub struct MultisigTransaction {
    pub multisig: Pubkey,
    pub transaction_id: u64,
    pub proposer: Pubkey,
    pub instructions: Vec<MultisigInstruction>,
    pub signers: Vec<bool>, // Which owners have signed
    pub executed: bool,
    pub execution_time: Option<i64>,
    pub expiry_time: i64,
    pub transaction_type: MultisigTransactionType,
    pub approval_count: u8,
    pub rejection_count: u8,
    pub metadata: TransactionMetadata,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MultisigInstruction {
    pub program_id: Pubkey,
    pub accounts: Vec<MultisigAccountMeta>,
    pub data: Vec<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MultisigAccountMeta {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MultisigMetadata {
    pub name: [u8; 64],
    pub description: [u8; 256],
    pub created_at: i64,
    pub daily_limit: u64,
    pub monthly_limit: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionMetadata {
    pub title: [u8; 128],
    pub description: [u8; 256],
    pub amount: Option<u64>,
    pub currency: Option<[u8; 8]>,
    pub counterparty: Option<Pubkey>,
    pub risk_assessment: Option<RiskAssessment>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RiskAssessment {
    pub risk_level: RiskRating,
    pub assessment_reason: [u8; 256],
    pub assessed_by: Pubkey,
    pub assessed_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MultisigType {
    Institutional,    // Bank-grade multisig
    Corporate,        // Company treasury
    DAO,             // Decentralized governance
    Personal,        // Individual multi-device
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MultisigPermissions {
    Full,           // All operations allowed
    Limited,        // Restricted operations
    Compliance,     // Compliance officer approval required
    ReadOnly,       // View only
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MultisigTransactionType {
    Transfer,
    VaultOperation,
    ComplianceUpdate,
    GovernanceChange,
    EmergencyAction,
    RoutineOperation,
}
#[account]
pub struct ComplianceAttestation {
    pub slot: u64,
    pub hash: [u8; 32],
}

#[account]
pub struct CounterpartyRelationship {
    pub owner: Pubkey,
    pub counterparty: Pubkey,
    pub allowed: bool,
}

#[account]
pub struct ReentrancyLock {
    pub is_locked: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RiskScore {
    Low,
    Medium,
    High,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    Allow,
    Reject,
}

#[event]
pub struct TransferEvaluated {
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
    pub attestation_slot: u64,
    pub risk_score: u8,
    pub decision: Decision,
    pub travel_rule_hash: [u8; 32],
}

impl MintConfig {
    pub const LEN: usize = 8 + 32 + 32 + 32 + (1 + 32) + 1;
}

