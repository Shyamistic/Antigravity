import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  sendAndConfirmTransaction,
  clusterApiUrl 
} from "@solana/web3.js";
import { 
  createMint, 
  TOKEN_2022_PROGRAM_ID, 
  getMint, 
  ExtensionType, 
  createInitializeTransferHookInstruction,
  getTransferHook 
} from "@solana/spl-token";

// IDL placeholder (USER: Replace with real IDL after anchor build)
const PROGRAM_ID = new PublicKey("beHz9dkAWuS5h4ws38EtjBJnTafMFHwPaECQkF5EHAY");

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate(); // USER: Use funded wallet in production
  
  console.log("Payer Address:", payer.publicKey.toBase58());
  console.log("Requesting Airdrop (Devnet)...");
  const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 1e9);
  await connection.confirmTransaction(airdropSig);

  const mint = Keypair.generate();
  const decimals = 6;

  console.log("Creating Token-2022 Mint with Transfer Hook...");
  
  // 1. Create Mint with Transfer Hook Extension
  const mintAddress = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    payer.publicKey, // freeze authority
    decimals,
    mint,
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID,
    // [ExtensionType.TransferHook] <- handled via instruction below in modern spl-token
  );

  console.log("Mint Created:", mintAddress.toBase58());

  // 2. Initialize Transfer Hook on the Mint
  const transaction = new Transaction().add(
    createInitializeTransferHookInstruction(
      mintAddress,
      payer.publicKey, // authority
      PROGRAM_ID,
      TOKEN_2022_PROGRAM_ID
    )
  );
  await sendAndConfirmTransaction(connection, transaction, [payer]);

  console.log("Transfer Hook Initialized on Mint.");

  // 3. Initialize Program Config & ExtraAccountMetaList (Anchor logic)
  // This part usually requires the Anchor IDL and a real deployment.
  console.log("PROTOCOL RECEIPT: $AG-USD Mint is ready for 'initialize_extra_account_meta_list'");
  console.log("Program ID:", PROGRAM_ID.toBase58());
}

main().catch(console.error);
