# 🌌 Antigravity: Technical System Analysis

## 1. Executive Summary
Antigravity is a high-assurance cross-border liquidity orchestrator built on Solana. It leverages **Token-2022 Transfer Hooks** to enforce institutional compliance (KYC/KYT/Travel Rule) atomically at the protocol level. Unlike post-settlement audit systems, Antigravity ensures that non-compliant transfers never enter the ledger.

---

## 2. Core Solana Program Architecture (`programs/antigravity-core`)

### 2.1 Unified Instruction Logic
The program features a consolidated instruction set designed for auditability and efficiency:
- **`register_kyc`**: Maps a user's wallet to an identity PDA containing their compliance status.
- **`approve_vault`**: Establishes an institutional liquidity vault with strict authority checks.
- **`vault_withdraw`**: Allows authorized entities to retrieve liquidity after proving compliance.
- **`update_transaction_monitor`**: Real-time monitor that gates transfers based on risk scoring.

### 2.2 Advanced Data Structures
- **`RiskFlag` (Bitmask)**: An efficient enum quantifying specific risk vectors (e.g., `Sanctioned`, `HighVolume`, `Ppe`).
- **`IdentityRegistry`**: A PDA-backed state object that ties Solana public keys to verified IVMS-101 metadata.

---

## 3. Compliance & Enforcement Engine

### 3.1 The 0x1770 Revert (Atomic Gate)
The protocol's signature feature is the **`AttestationExpired` (0x1770)** revert. 
- **Trigger**: Any transfer exceeding the institutional threshold (standardized at **$1,000** for Compliance Track alignment) without a fresh attestation (issued within the last block).
- **Enforcement**: Triggered via the `TransferHook` interface, ensuring zero-bypass capability.

### 3.2 FATF Travel Rule Alignment
The protocol enforces the $1,000 Travel Rule threshold globally. Transfers above this amount require a signed `TransactionMonitor` update, providing mathematical proof of originator and beneficiary identification.

---

## 4. Institutional Integration Layer

### 4.1 Real-Time FX Orchestration
The system integrates with a dedicated **FX Gateway** (supported by SIX API data) to provide:
- Transparent USD → CHF/EUR conversion discovery.
- Atomic settlement using real-time institutional exchange rates.

### 4.2 Featherless AI Reasoning
The "Senior Engineer" agent layer ensures that compliance decisions are research-backed:
- Analyzes cross-border regulations to adjust `RiskFlag` weights dynamically.
- Verifies the integrity of the audit trail before attestation issuance.

---

## 5. Verification Proofs
The system’s integrity is verified via:
- **`tests/anchor.test.ts`**: Simulates high-volume transfers to trigger and verify the `0x1770` compliance revert.
- **`scripts/receipt.ts`**: Generates a cryptographically verifiable "Decision Receipt" for every on-chain settlement.

---

**Protocol Status: Audit-Hardened & Demo-Ready**
*Finalized for StableHacks 2026 Submission*
