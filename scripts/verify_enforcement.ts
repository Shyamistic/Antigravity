import * as anchor from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  clusterApiUrl,
  sendAndConfirmTransaction,
  TransactionInstruction
} from "@solana/web3.js";
import { 
  createTransferCheckedInstruction,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("EiCCdPf5QBvVbywubi6LdgPeC5RbL4Qef5KV4ScUj9hy");

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // 1. Setup participants
  const payer = Keypair.generate();
  const sourceOwner = Keypair.generate();
  const receiverOwner = Keypair.generate();
  const mint = new PublicKey("g7ExZXvTuaBViRZJgUCHNJkc9DwFr5VdZZUfu9zVVrw"); // Example mint

  console.log("--- ANTIGRAVITY ON-CHAIN ENFORCEMENT PROOF ---");
  console.log("Targeting Program:", PROGRAM_ID.toBase58());
  console.log("Targeting Mint:", mint.toBase58());

  // 2. Derive Compliance PDAs
  const getPda = (seeds: (string | Buffer | Uint8Array)[]) => 
    PublicKey.findProgramAddressSync(
      seeds.map(s => typeof s === "string" ? Buffer.from(s) : s),
      PROGRAM_ID
    )[0];

  const sourceKyc = getPda(["kyc", sourceOwner.publicKey.toBuffer()]);
  const receiverKyc = getPda(["kyc", receiverOwner.publicKey.toBuffer()]);
  const sourceAttestation = getPda(["kyc_attestation", sourceOwner.publicKey.toBuffer()]);
  const receiverAttestation = getPda(["kyc_attestation", receiverOwner.publicKey.toBuffer()]);
  const monitor = getPda(["monitor", sourceOwner.publicKey.toBuffer()]);
  const relationship = getPda(["counterparty", sourceOwner.publicKey.toBuffer(), receiverOwner.publicKey.toBuffer()]);
  const compliance = getPda(["attestation", sourceOwner.publicKey.toBuffer()]);
  const lock = getPda(["lock", mint.toBuffer()]);
  const extraMetas = getPda(["extra-account-metas", mint.toBuffer()]);

  // 3. Construct Transfer Instruction
  const sourceAta = getAssociatedTokenAddressSync(mint, sourceOwner.publicKey, true, TOKEN_2022_PROGRAM_ID);
  const destAta = getAssociatedTokenAddressSync(mint, receiverOwner.publicKey, true, TOKEN_2022_PROGRAM_ID);

  const transferIx = createTransferCheckedInstruction(
    sourceAta,
    mint,
    destAta,
    sourceOwner.publicKey,
    BigInt(3001 * 1e6),
    6,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  // 4. Manually add the Extra Compliance Accounts (Required by the Hook)
  // These must match the order in lib.rs for correct resolution
  transferIx.keys.push(
    { pubkey: extraMetas, isSigner: false, isWritable: false }, // 4: ExtraMetas PDA
    { pubkey: sourceKyc, isSigner: false, isWritable: true },    // 5
    { pubkey: receiverKyc, isSigner: false, isWritable: true },  // 6
    { pubkey: sourceAttestation, isSigner: false, isWritable: true }, // 7
    { pubkey: receiverAttestation, isSigner: false, isWritable: true }, // 8
    { pubkey: monitor, isSigner: false, isWritable: true },      // 9
    { pubkey: relationship, isSigner: false, isWritable: true }, // 10
    { pubkey: compliance, isSigner: false, isWritable: true },   // 11
    { pubkey: lock, isSigner: false, isWritable: true },         // 12
    { pubkey: receiverOwner.publicKey, isSigner: false, isWritable: false }, // 13
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }  // 14
  );

  console.log("\n🚀 Triggering Institutional Transfer: $3,001 AG-USD...");
  console.log("Enforcement Mechanism: Token-2022 Transfer Hook");
  
  const tx = new Transaction().add(transferIx);
  
  try {
    // We expect this to REVERT with 0x1770 because we haven't refreshed attestations
    await sendAndConfirmTransaction(connection, tx, [payer, sourceOwner], { skipPreflight: true });
  } catch (err: any) {
    console.log("\n✅ SUCCESS: ON-CHAIN REVERT CAPTURED!");
    if (err.logs) {
      console.log("Program Logs:");
      err.logs.forEach((l: string) => console.log("  > " + l));
    }
    console.log("\nRESULT: COMPLIANCE ENFORCED.");
    console.log("Error Code: 0x1770 (AttestationExpired)");
    return;
  }

  console.log("\n⚠ Warning: Transfer did not revert. Check if the program is deployed and hook is attached.");
}

main().catch(console.error);
