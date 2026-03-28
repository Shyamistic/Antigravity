---
description: Demonstrate Antigravity's deterministic compliance and Token-2022 transfer hook enforcement.
---

1. Initialize the Compliance Monitor:
- Navigate to the **Compliance Gate** tab on the dashboard.
- Ensure the **Protocol Audit Log Stream** is synced.

2. Simulate a Security Violation:
- Click the **SIMULATE_ROGUE_AI** button.
- Observe the immediate `WARN` entry in the log stream: `ROGUE_AGENT_K7_DETECTED`.

3. Verify Token-2022 Enforcement:
- Note that the **FATF Violation Matrix** now shows `BLOCKED` for the rogue agent.
- High-speed telemetry will confirm that the **Transfer Hook** has effectively frozen the transaction.

4. Clear the System State:
- The system will auto-recover after 400 slots as per the Attestation TTL policy.
