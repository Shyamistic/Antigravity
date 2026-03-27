# Antigravity Installation Guide

Follow these steps to set up the full Solana/Anchor development environment for the Antigravity Institutional Blueprint.

## 1. Prerequisites (Node.js)
You already have Node.js installed (verified via `npx`). To verify your version:
```bash
node -v  # Recommended: v18.18.0 or higher
```

---

## 2. Install Rust Toolchain
Solana programs are written in Rust.
1. Install Rust via rustup: [rustup.rs](https://rustup.rs/)
2. Verify:
```bash
rustc --version
```

---

## 3. Install Solana CLI (Windows)
1. Open PowerShell as Administrator.
2. Run this command to ensure TLS 1.2 is used, then download the installer:
```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
Invoke-WebRequest -Uri "https://release.solana.com/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
```
3. Execute the installer:
```powershell
& "$env:TEMP\solana-install-init.exe" v1.18.4
```
4. Close and reopen your terminal.
5. Verify:
```bash
solana --version
```

---

## 4. Install Anchor CLI
1. Use Cargo (Rust's package manager) to install Anchor:
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```
2. Verify:
```bash
anchor --version
```

---

## 5. Development Setup
Once the tools are installed, set up the project:

```bash
# 1. Generate a local keypair if you don't have one
solana-keygen new --no-passphrase

# 2. Build the Solana programs
anchor build

# 3. Install Node.js dependencies
npm install                     # Root (for tests)
cd app/dashboard && npm install # Frontend
cd ../compliance-gateway && npm install
cd ../sdp-bridge && npm install
```

---

## 🚀 Quick Start (No Solana Install Required)
If you only want to see the system logic, you can run the simulation using just Node.js:
```bash
npx -y ts-node simulation/yield_sweep.ts
```
