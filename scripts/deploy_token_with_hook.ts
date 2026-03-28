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
const PROGRAM_ID = new PublicKey("EiCCdPf5QBvVbywubi6LdgPeC5RbL4Qef5KV4ScUj9hy");

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate(); // USER: Use funded wallet in production
  
  console.log("Payer Address:", payer.publicKey.toBase58());
  console.log("Requesting Airdrop (Devnet)...");
  try {
    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 1e9);
    await connection.confirmTransaction(airdropSig);
  } catch (e) {
    console.log("Airdrop failed (rate limited?), proceeding with existing balance if any...");
  }

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
    TOKEN_2022_PROGRAM_ID
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
  
  // 3. Add Initialize Extra Account Meta List Instruction
  // Discriminator: sha256("global:initialize_extra_account_meta_list")[..8] => 5cc5aec5297c1303
  const discriminator = Buffer.from("5cc5aec5297c1303", "hex");
  const extraMetasAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mintAddress.toBuffer()],
    PROGRAM_ID
  )[0];

  transaction.add({
    keys: [
      { pubkey: extraMetasAccount, isSigner: false, isWritable: true },
      { pubkey: mintAddress, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: discriminator,
  });

  await sendAndConfirmTransaction(connection, transaction, [payer, mint]);

  console.log("Transfer Hook & MetaList Initialized.");
  console.log("PROTOCOL RECEIPT: $AG-USD Mint is ready for compliant transfers.");
  console.log("Program ID:", PROGRAM_ID.toBase58());
}

main().catch(console.error);
