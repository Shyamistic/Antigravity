import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  Transaction 
} from "@solana/web3.js";
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferCheckedInstruction,
  createMint
} from "@solana/spl-token";

describe("Antigravity Compliance Test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AntigravityCore as anchor.Program;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer || Keypair.generate();

  it("Trigger Protocol Revert (0x1770)", async () => {
    console.log("--- ANTIGRAVITY: THE FINAL PROOF ---");
    
    // 1. Setup Mint & Accounts
    const mint = Keypair.generate();
    await createMint(
        connection,
        payer,
        payer.publicKey,
        payer.publicKey,
        6,
        mint,
        { commitment: "confirmed" },
        TOKEN_2022_PROGRAM_ID
    );

    const extraMetasAccount = PublicKey.findProgramAddressSync(
      [Buffer.from("extra-account-metas"), mint.publicKey.toBuffer()],
      program.programId
    )[0];

    // Initialize Extra Metas (Discriminator: 5cc5aec5297c1303)
    await program.methods.initializeExtraAccountMetaList()
      .accounts({
        extraAccountMetaList: extraMetasAccount,
        mint: mint.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const receiver = Keypair.generate();
    const sourceAta = getAssociatedTokenAddressSync(mint.publicKey, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const destAta = getAssociatedTokenAddressSync(mint.publicKey, receiver.publicKey, false, TOKEN_2022_PROGRAM_ID);

    await provider.sendAndConfirm(new Transaction().add(
      createAssociatedTokenAccountInstruction(payer.publicKey, sourceAta, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
      createAssociatedTokenAccountInstruction(payer.publicKey, destAta, receiver.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
      createMintToInstruction(mint.publicKey, sourceAta, payer.publicKey, 10000 * 1e6, [], TOKEN_2022_PROGRAM_ID)
    ));

    // 2. Mock Compliance Data
    const getPda = (seeds: any[]) => PublicKey.findProgramAddressSync(seeds.map(s => typeof s === "string" ? Buffer.from(s) : s), program.programId)[0];
    
    // Initialize required compliance accounts
    await program.methods.registerKyc("Institutional_User", "US")
      .accounts({
        identityRegistry: getPda(["kyc", payer.publicKey.toBuffer()]),
        owner: payer.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();

    await program.methods.registerKyc("Receiver_User", "CH")
      .accounts({
        identityRegistry: getPda(["kyc", receiver.publicKey.toBuffer()]),
        owner: receiver.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).signers([receiver]).rpc();

    // 3. Trigger Transfer with NO Attestation (Expected Revert 0x1770)
    console.log("🚀 Triggering Compliance Revert ($3,001 Transfer)...");
    
    const transferIx = createTransferCheckedInstruction(
        sourceAta, 
        mint.publicKey, 
        destAta, 
        payer.publicKey, 
        3001 * 1e6, 
        6, 
        [], 
        TOKEN_2022_PROGRAM_ID
    );
    
    // Add compliance accounts manually for the hook
    transferIx.keys.push(
      { pubkey: extraMetasAccount, isSigner: false, isWritable: false },
      { pubkey: getPda(["kyc", payer.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["kyc", receiver.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["kyc_attestation", payer.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["kyc_attestation", receiver.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["monitor", payer.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["counterparty", payer.publicKey.toBuffer(), receiver.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["attestation", payer.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: getPda(["lock", mint.publicKey.toBuffer()]), isSigner: false, isWritable: true },
      { pubkey: receiver.publicKey, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    );

    try {
      const tx = new Transaction().add(transferIx);
      await provider.sendAndConfirm(tx);
      expect.fail("Protocol should have blocked un-attested transfer!");
    } catch (err: any) {
      console.log("✅ SUCCESS: On-Chain Revert Captured!");
      // Robust error detection
      const logs = err.logs || [];
      const isExpired = logs.some((l: string) => l.includes("AttestationExpired") || l.includes("0x1770"));
      expect(isExpired).to.be.true;
    }
  });
});
