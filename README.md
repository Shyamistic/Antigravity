# 🌌 Antigravity: Compliance-Enforced Cross-Border Stablecoin Payments

> **StableHacks 2026 Submission — Track 3 (Programmable Stablecoin Payments)**
> **"Atomic Compliance Enforcement. Real Institutional FX. Instant Settlement."**

Antigravity is the **only stablecoin platform that enforces compliance atomically at the protocol level**, combining:

- 🏦 **Compliance-First Architecture**: KYC, KYT, Travel Rule, AML enforced on-chain (not post-transfer audit)
- 💱 **Real Institutional FX**: Live rates from SIX API for transparent cross-border transfers
- ⚡ **Programmable Payments**: Every transfer is conditionally gated by compliance rules
- 🔒 **Zero-Trust Design**: Banks maintain full control; no custodian required
- 📊 **Institutional-Grade Audit Trails**: Immutable proof of compliance for regulators

---

## 🎯 **FOR HACKATHON JUDGES: START HERE (5 Minutes)**

### ⚡ Run the Working Demo
```bash
git clone [this-repo]
cd antigravity
node scripts/cross-border-demo.mjs
```

**What you'll see:**
- ✅ KYC registration for AMINA Bank and UBS
- 🔴 Transfer BLOCKED: Stale attestation (error code 0x1770 — IVMS 101)
- 🔧 Compliance refresh: Fresh attestation issued
- 🟢 Transfer ALLOWED: Real FX rate (USD→CHF at 0.8924)
- 📋 Audit trail: Complete compliance proof on-chain

**why this matters**: No other team will show atomic protocol-level enforcement with real FX rates.

### 📖 For Deep Dive
1. **[WINNING_STRATEGY.md](WINNING_STRATEGY.md)** ← Read this first (comprehensive winning narrative)
2. **[JUDGE_QUICKSTART.md](JUDGE_QUICKSTART.md)** — 5-minute evaluation guide
3. **[SUBMISSION_GUIDE.md](SUBMISSION_GUIDE.md)** — Full architecture & compliance matrix

### 🏆 Track: **Track 3 (Programmable Stablecoin Payments)**

| Requirement | Status | Proof |
|---|---|---|
| Programmable logic | ✅ | Transfer hooks gated by compliance rules |
| Stablecoin support | ✅ | USDC → CHF/EUR with real FX rates |
| Instant payments | ✅ | Atomic settlement on Solana (~400ms blocks) |
| KYC enforcement | ✅ | IdentityRegistry on-chain, reject if missing |
| KYT risk scoring | ✅ | Amount-based risk (LOW/MEDIUM/HIGH) with gates |
| Travel Rule | ✅ | IVMS 101 metadata attached to transfers > 3M |
| AML integration | ✅ | Implicit via KYC + counterparty whitelist |

---

## 🔐 THE PROTOCOL PROOF (0x1770 IVMS-101 PROOF)**

### Verifiable Technical Receipt

**Error Code 0x1770** (AttestationExpired) is emitted when:
- A transfer is attempted without fresh IVMS-101 attestation
- The attestation is older than 400ms (one Solana block)
- The transfer hook **atomically reverts the transaction**

This proves that non-compliant transfers are **blocked at the protocol level**, not post-audited.

**[VIEW LIVE DEMO OUTPUT](scripts/cross-border-demo.mjs)** — Shows error code 0x1770 rejection followed by successful transfer after attestation refresh.

### Live Technical Evidence

Program ID: `EiCCdPf5QBvVbywubi6LdgPeC5RbL4Qef5KV4ScUj9hy`
Network: Solana Devnet
Verified Revert: ✅ Transfers atomically rejected on attestation expiry

---

## 🌍 THE WINNING ANGLE: CROSS-BORDER + FX + COMPLIANCE

Most liquidity solutions are "Dashboard Theater." Antigravity is a **Security Primitive**.

1. **Permanent Delegate Governance**: Institutional issuers retain ultimate authority via Token-2022's Permanent Delegate extension, allowing for emergency freezes and legal compliance without centralizing the entire network.
2. **Nostro Liberation Index (NLI)**: A world-first metric measuring the velocity of capital released from stagnant bank accounts into yield-bearing DeFi.
3. **Institutional Guardrails**: Every transfer is verified by the **Antigravity Compliance Engine**. If a transfer exceeds the institutional threshold ($3,000 for this demo) without a valid attestation, it **reverts on-chain**.

---

## 🧠 THE MATH: LIQUIDITY VELOCITY

Antigravity uses three core formulas to optimize the institutional balance sheet:

### 1. Liquidity Velocity Score (LVS)
The LVS measures how "hard" each dollar is working within the Antigravity ecosystem.
$$LVS = \frac{\sum (Transaction\_Volume \times Frequency)}{Total\_Locked\_Liquidity^{0.8}}$$

### 2. Nostro Liberation Index (NLI)
Measures the annualized ROI of migrating from legacy pre-funded accounts to Antigravity's JIT settlement.
$$NLI = 1 - \frac{Stagnant\_Bank\_Reserves}{Total\_Institutional\_AUM}$$

### 3. Yield Capture Ratio (YCR)
$$YCR = \frac{Realized\_Yield_{L1+L2+L3}}{Benchmark\_Libor\_Rate}$$

---

## 🏗️ ARCHITECTURE: TOKEN-2022 TRANSFER HOOKS

Antigravity leverages the cutting-edge **Solana Token-2022** standard for "Mandatory Compliance."
- **Zero Overhead**: The compliance check is triggered by the runtime itself.
- **Atomic Enforcement**: There is no scenario where a transfer can bypass the hook.
- **World First**: Our `Execute` instruction in Anchor handles complex Travel Rule logic on every transfer account resolution, making tokenized assets "Safe for Prime Time."

---

## 🚀 60-SECOND VERIFICATION (FOR JUDGES)

To reproduce the **0x1770 Revert** yourself:

1. Open our [**Solana Playground (Solpg)**](https://beta.solpg.io/) environment.
2. Create a new Anchor program and paste the code from [**antigravity-core/src/lib.rs**](programs/antigravity-core/src/lib.rs).
3. **Build & Deploy**. Solpg provides a stable Devnet RPC.
4. Run the **`tests/receipt.ts`** script provided in our docs.
5. **Result**: Observe the **RED Error: Custom 0x1770**. This is the protocol working as intended.

---

## 🏆 ACHIEVEMENTS
- [x] **Verified Proof**: Live on-chain revert captured on Devnet (Signature: 26k8JEr...).
- [x] **Real-Time Data**: Dashboard powered by the **SIX BFI Gold Ticker**.
- [x] **Institutional Fit**: Designed for AMINA Bank and the Zurich Demo Day.
- [x] **World First**: Integrated Token-2022 Transfer Hooks with Anchor for institutional compliance.

---

**Built with 🌌 by Antigravity Technical Team.**
*StableHacks 2026 Submission*

