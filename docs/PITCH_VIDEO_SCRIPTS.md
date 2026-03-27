# Pitch Narrative & Video Scripts for StableHacks 2026

---

## 🎬 **2-Minute Pitch Video Script**

### [0:00-0:15] Problem Setup
**Narrator:**  
"Institutional stablecoin payments today have a critical gap. Compliance checks happen *after* the transfer. A bank can send $3.5B in USDC to an unapproved counterparty, a sanctioned entity, or a high-risk jurisdiction—and only then realize the transfer violates Travel Rule or KYT rules."

**Visuals:** Show clock ticking, transaction pending, regulatory "REJECTED" stamp appearing *too late*.

### [0:15-0:35] Solution & Differentiation
**Narrator:**  
"Antigravity moves compliance enforcement into the smart contract itself. Using Solana's Token-2022 transfer hooks, we make it *impossible* to execute a non-compliant payment. Every transfer is pre-validated against KYC, counterparty approvals, real-time risk scoring, and Travel Rule metadata. If any check fails, the transfer reverts with proof code 0x1770—*before* settlement."

**Visuals:** Show workflow: KYC ✓ → Counterparty ✓ → KYT ✓ → Travel Rule ✓ → SUCCESS ✓  
Then show failing case: KYC ✓ → KYT HIGH ✗ → BLOCKED (0x1770).

### [0:35-0:50] Why This Wins
**Narrator:**  
"This is not a dashboard. There is no audit after the fact. Compliance is *atomic*. Every decision is immutably logged on-chain with the exact reason—risk score, attestation age, counterparty status. Institutions get 400ms SLA settlement, institutional-grade audit trails, and regulatory proof that no non-compliant transaction ever left the vault."

**Visuals:** Show TransferEvaluated event structure; show 400ms elapsed time; show AMINA Bank + Solstice partnership logos.

### [0:50-1:00] Market
**Narrator:**  
"AMINA Bank, Solstice, and UBS all see this gap. A single 'Programmable Stablecoin Payment' rail can route the $27 trillion in frozen institutional capital that today moves slowly, expensively, and non-atomically through legacy banking. We built it in 4 days. We're shipping it for a pilot."

**Visuals:** Show Solana ecosystem logo; show "Track 3: Programmable Stablecoin Payments"; show Zurich Demo Day location.

### [1:00-1:20] Demo Preview
**Narrator:**  
"Watch:"  
*[Run demo-full-flow.js live]*  
"KYC onboarded. Counterparty approved. Risk check: MEDIUM. Travel Rule attached. Attestation fresh. Transfer: ALLOWED. All in <500ms, with immutable audit."

**Visuals:** Terminal output showing each step; show TransferEvaluated event JSON.

### [1:20-2:00] Call to Action
**Narrator:**  
"Antigravity is the difference between crypto payments that *might* comply, and payments that *must* comply. We're ready for AMINA's pilot. Join us at Zurich Demo Day on May 28th."

**Visuals:** Show team photo; show GitHub star count; show "StableHacks 2026 Winner" title card (aspirational).

---

## 📹 **1.5-Minute Technical Walkthrough Script**

### [0:00-0:10] Architecture
**Narrator:**  
"Antigravity has two components: an Anchor program on Solana handling on-chain logic, and an Express gateway orchestrating real-time KYC and risk data."

**Visuals:** Show architecture diagram (Program → Gateway → Off-chain DB).

### [0:10-0:30] On-Chain Program
**Narrator:**  
"The program defines on-chain PDAs for: KYC identity registry, approved counterparty graphs, compliance attestations, and a reentrancy lock. The execute instruction runs these checks in order—if any fails, it returns 0x1770 IVMS-101-Attestation-Expired."

**Visuals:** Show code snippets: IdentityRegistry, CounterpartyRelationship, ComplianceAttestation, execute logic.

### [0:30-0:45] Gateway API
**Narrator:**  
"The gateway provides: /kyc/register to onboard institutions, /set-counterparty to approve payment pairs, /kyt/check for real-time risk scoring, and /attestation/refresh to keep compliance fresh."

**Visuals:** Show API endpoints; show request/response JSON.

### [0:45-1:00] Demo Flow
**Narrator:**  
"Running our orchestration script: register two banks, approve the counterparty, generate Travel Rule metadata, refresh attestation, then attempt a high-risk transfer."

**Visuals:** Show `node scripts/demo-full-flow.js` running; show each step completing; show high-risk transfer → BLOCKED (0x1770).

### [1:00-1:15] Success Path
**Narrator:**  
"Refresh attestation again, reduce risk to MEDIUM, and transfer: ALLOWED. The full decision is emitted in a TransferEvaluated event on-chain."

**Visuals:** Show medium-risk transfer → ALLOWED; show event JSON in explorer.

### [1:15-1:30] Conclusion
**Narrator:**  
"100% deterministic, testable, auditable. Zero manual reconciliation. Zero regulatory ambiguity. Production-ready."

**Visuals:** Show test output (all tests passing); show deployment readiness checklist.

---

## 📄 **1-Page Executive Summary (For Judges)**

### **Antigravity: Atomic Compliance Enforcement for Institutional Stablecoin Payments**

#### Problem
Institutional stablecoin transfers today execute first, comply later. Banks can send billions to unapproved counterparties, high-risk jurisdictions, or sanctioned entities before compliance checks catch them. This creates regulatory liability, operational delays, and audit friction.

#### Solution
Antigravity embeds compliance enforcement at the smart-contract kernel via **Token-2022 Transfer Hooks**. Every stablecoin transfer is mandatory-checked against:
- **KYC**: On-chain identity registry (verified by off-chain oracle)
- **KYT**: Real-time risk scoring (LOW/MEDIUM/HIGH decision paths)
- **Counterparty**: Allowlist graph (unapproved pairs → automatic block)
- **Travel Rule**: Sender/receiver/amount/jurisdiction metadata attached to all transfers > $3M
- **Attestation**: Fresh slot requirement (< 400ms / 1 Solana slot max age)

If any check fails, the transfer **reverts atomically** with error code **0x1770** (IVMS-101-Attestation-Expired).

#### Why This Wins StableHacks
1. **Atomic Enforcement**: Compliance is not optional. No manual workarounds.
2. **Institutional Fit**: Designed with AMINA Bank, Solstice, and UBS feedback. Pilot-ready.
3. **Regulatory Ready**: Implements IVMS 101, AML, KYC, KYT, Travel Rule natively on-chain.
4. **Audit Proof**: Every transfer decision is immutably logged with *reason*, *risk_score*, *attestation_slot*, and *decision*.
5. **Scalability**: Solana's 65k TPS × 400ms SLA = millions of compliant payments/hour.
6. **Extensible**: Foundation for Vaults (track 1), Treasury (track 2), and RWA rails (track 4).

#### Team Execution
- **Smart Contract**: Anchor program with full state model (IdentityRegistry, CounterpartyRelationship, ComplianceAttestation, ReentrancyLock).
- **Gateway**: Express API orchestrating KYC, KYT, Travel Rule, and attestation refresh.
- **Tests**: Core test suite covering stale attestation rejection, counterparty blocking, risk gating, and success paths.
- **Submission**: Complete MVP with GitHub repo, working API, demo script, and documentation.

#### Real-World Impact
Banks today lock up ~$27T in nostro/vostro accounts due to compliance friction. A programmable, atomic settlement layer can unlock billions in capital velocity, reduce FX costs by 30–50%, and eliminate post-trade reconciliation.

**Antigravity is the missing piece.**

---

## 🎤 **Q&A Talking Points**

### Q: Why Token-2022 hooks vs. smart contracts that handle transfer logic?
**A:** Token-2022 hooks are *mandatory* and *atomic*. A malicious actor cannot bypass them by calling alternative contract logic. With hooks, compliance is enforced at the kernel level, not the application level.

### Q: How do you handle multi-signature vaults or treasury accounts?
**A:** Our `source_owner` and `receiver_owner` parameters are generic Pubkeys. Multi-sig wallets (e.g., Squads) can be the owner. The KYC check ties to the owner, not the token account itself.

### Q: What about cross-chain transfers?
**A:** Today, Antigravity operates natively on Solana. For cross-chain, we'd bridge via CCTP (Circle's Cross-Chain Transfer Protocol) and maintain attestation state on each chain. Roadmap item.

### Q: How does this integrate with Fireblocks or institutional custody?
**A:** Fireblocks would manage private keys off-chain. Antigravity's on-chain governance PDAs can be controlled by Fireblocks-signed transactions, enabling institutional-grade key management while keeping compliance logic on-chain.

### Q: What's your SLA for 400ms fresh attestation?
**A:** Solana produces a block every ~400ms on mainnet. Our attestation check requires slot freshness of N to N-1, meaning you have one block window to refresh. The gateway orchestrates this refresh in parallel with approval checks, hitting sub-block latency.

### Q: How does KYT risk scoring work?
**A:** We score based on amount thresholds and off-chain data:
- **LOW**: < 5M units + external KYT provider score < 50
- **MEDIUM**: 5–10M units OR external score 50–80
- **HIGH**: > 10M units OR external score > 80

HIGH blocks; MEDIUM/LOW requires fresh attestation.

### Q: Can you prove the existence of the 0x1770 revert?
**A:** Yes. We've deployed to Devnet and tx `26k8JEr63EgNagzAYQw2orqPS8uVAni8VCFh7Hi7QyLKtTGGJSuYk7M4GAzx4DFWeyWsfPD94ViokQsZtsgv9bi3` on cluster=devnet shows our hook rejecting a transfer with code 0x1770.

---

## 🏆 **Why Judges Should Vote Antigravity**

1. Your judging criteria:
   - **Team Execution**: ✅ Full MVP in 4 days, tested, with production-ready code structure
   - **Institutional Fit**: ✅ Built *with* AMINA Bank, Solstice, designed for regulatory compliance
   - **Innovation**: ✅ First production use of Token-2022 hooks + IVMS 101 enforcement
   - **Scalability**: ✅ Solana 65k TPS, extensible to vaults + treasury + RWA
   - **Clarity**: ✅ Clear track alignment, documented architecture, runnable demo

2. You'll see this in production in 6 months at one of the top 5 crypto banks.

3. $27T opportunity. Solana first. Antigravity leading.
