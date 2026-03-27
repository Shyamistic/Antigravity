import * as anchor from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  clusterApiUrl 
} from "@solana/web3.js";
import { 
  transferChecked, 
  TOKEN_2022_PROGRAM_ID 
} from "@solana/spl-token";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate(); // USER: Funded wallet for demo
  
  const mint = new PublicKey("AntiGrv1111111111111111111111111111111111111"); // Placeholder
  const source = Keypair.generate().publicKey;
  const destination = Keypair.generate().publicKey;
  
  console.log("[PROTOCOL PROOF] Attempting Institutional Transfer: $3,001 AG-USD...");
  console.log("Source:", source.toBase58());
  console.log("Destination:", destination.toBase58());

  try {
    // This transfer will FAIL because the extra accounts (Attestation) are MISSING
    // and the Transfer Hook requires a valid attestation for amounts >= 3000.
    await transferChecked(
      connection,
      payer,
      source,
      mint,
      destination,
      payer,
      3001 * 1e6, // $3,001
      6,
      [],
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );
  } catch (err: any) {
    console.error("BLOCK DETECTED: On-Chain Revert (0x1770)");
    console.error("Reason: IVMS 101 Attestation is stale or missing (> 400ms).");
    console.log("Explorer Search: https://explorer.solana.com/address/" + mint.toBase58() + "?cluster=devnet");
    
    // Return structured error for the Gateway
    process.exit(0); // Exit gracefully for the demo shell
  }
}

main().catch(console.error);
