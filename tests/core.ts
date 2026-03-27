import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AntigravityCore } from "../target/types/antigravity_core";
import { expect } from "chai";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("antigravity-core", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AntigravityCore as Program<AntigravityCore>;

  it("handles full compliance flow with stale and fresh attestation", async () => {
    const source = Keypair.generate();
    const receiver = Keypair.generate();

    const entityIdSource = "SourceBank";
    const entityIdReceiver = "ReceiverBank";

    // Register KYC for both parties
    await program.methods
      .registerKyc(entityIdSource, "US")
      .accounts({
        identityRegistry: PublicKey.findProgramAddressSync([Buffer.from("identity"), source.publicKey.toBuffer()], program.programId)[0],
        owner: source.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([source])
      .rpc();

    await program.methods
      .registerKyc(entityIdReceiver, "US")
      .accounts({
        identityRegistry: PublicKey.findProgramAddressSync([Buffer.from("identity"), receiver.publicKey.toBuffer()], program.programId)[0],
        owner: receiver.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([receiver])
      .rpc();

    // Set counterparty approval
    await program.methods
      .setCounterparty(true)
      .accounts({
        counterpartyRelationship: PublicKey.findProgramAddressSync([Buffer.from("counterparty"), source.publicKey.toBuffer(), receiver.publicKey.toBuffer()], program.programId)[0],
        owner: source.publicKey,
        counterparty: receiver.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([source])
      .rpc();

    const attestationPda = PublicKey.findProgramAddressSync([Buffer.from("attestation"), source.publicKey.toBuffer()], program.programId)[0];
    const sourceKycAttestationPda = PublicKey.findProgramAddressSync([Buffer.from("kyc_attestation"), source.publicKey.toBuffer()], program.programId)[0];
    const receiverKycAttestationPda = PublicKey.findProgramAddressSync([Buffer.from("kyc_attestation"), receiver.publicKey.toBuffer()], program.programId)[0];
    const transactionMonitorPda = PublicKey.findProgramAddressSync([Buffer.from("monitor"), source.publicKey.toBuffer()], program.programId)[0];

    await program.methods
      .refreshAttestation(Buffer.alloc(32, 1))
      .accounts({
        complianceAttestation: attestationPda,
        authority: source.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([source])
      .rpc();

    // Attempt with stale attestation — expect AttestationExpired
    try {
      await program.methods
        .execute(new anchor.BN(3_500_000_000), Buffer.alloc(32, 2), 55)
        .accounts({
          sourceAccount: source.publicKey,
          mint: PublicKey.findProgramAddressSync([Buffer.from("config"), source.publicKey.toBuffer()], program.programId)[0],
          destinationAccount: receiver.publicKey,
          sourceOwner: source.publicKey,
          receiverOwner: receiver.publicKey,
          sourceKyc: PublicKey.findProgramAddressSync([Buffer.from("kyc"), source.publicKey.toBuffer()], program.programId)[0],
          receiverKyc: PublicKey.findProgramAddressSync([Buffer.from("kyc"), receiver.publicKey.toBuffer()], program.programId)[0],
          sourceKycAttestation: sourceKycAttestationPda,
          receiverKycAttestation: receiverKycAttestationPda,
          transactionMonitor: transactionMonitorPda,
          counterpartyRelationship: PublicKey.findProgramAddressSync([Buffer.from("counterparty"), source.publicKey.toBuffer(), receiver.publicKey.toBuffer()], program.programId)[0],
          complianceAttestation: attestationPda,
          lock: PublicKey.findProgramAddressSync([Buffer.from("lock"), source.publicKey.toBuffer()], program.programId)[0],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([source])
        .rpc();
      expect.fail("Expected execute to revert due expired attestation");
    } catch (e: any) {
      expect(e.message).to.include("AttestationExpired");
    }

    // Refresh attestation and retry for success
    await program.methods
      .refreshAttestation(Buffer.alloc(32, 3))
      .accounts({
        complianceAttestation: attestationPda,
        authority: source.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([source])
      .rpc();

    const tx = await program.methods
      .execute(new anchor.BN(3_500_000_000), Buffer.alloc(32, 2), 45)
      .accounts({
        sourceAccount: source.publicKey,
        mint: PublicKey.findProgramAddressSync([Buffer.from("config"), source.publicKey.toBuffer()], program.programId)[0],
        destinationAccount: receiver.publicKey,
        sourceOwner: source.publicKey,
        receiverOwner: receiver.publicKey,
        sourceKyc: PublicKey.findProgramAddressSync([Buffer.from("kyc"), source.publicKey.toBuffer()], program.programId)[0],
        receiverKyc: PublicKey.findProgramAddressSync([Buffer.from("kyc"), receiver.publicKey.toBuffer()], program.programId)[0],
        sourceKycAttestation: sourceKycAttestationPda,
        receiverKycAttestation: receiverKycAttestationPda,
        transactionMonitor: transactionMonitorPda,
        counterpartyRelationship: PublicKey.findProgramAddressSync([Buffer.from("counterparty"), source.publicKey.toBuffer(), receiver.publicKey.toBuffer()], program.programId)[0],
        complianceAttestation: attestationPda,
        lock: PublicKey.findProgramAddressSync([Buffer.from("lock"), source.publicKey.toBuffer()], program.programId)[0],
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([source])
      .rpc();

    expect(tx).to.be.ok;
  }).timeout(120000);
});
