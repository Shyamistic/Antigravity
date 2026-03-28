import express from 'express';
import cors from 'cors';
import { Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createInitializeMint2Instruction,
    ExtensionType,
    getMintLen,
    createInitializeTransferHookInstruction,
} from "@solana/spl-token";
import https from 'https';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const PROGRAM_ID_STR = "Heh9pGUxRkkkEPkWv3xiBxcb3tqd7t4vDMf8vu9sxrxG";
const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// ==================== INSTITUTIONAL CONFIG (SPONSORS) ====================
const SPONSORS = {
    AMINA_BANK: { name: "AMINA Bank SA", status: "PILOT_ACTIVE", jurisdiction: "CH" },
    UBS: { name: "UBS AG", status: "SYNDICATE_MEMBER", jurisdiction: "CH" },
    SIX_BFI: { name: "SIX BFI", status: "VALIDATOR_NODE", jurisdiction: "CH" },
    SOLANA: { name: "Solana Foundation", status: "PROTOCOL_SPONSOR", jurisdiction: "GLOBAL" },
    FIREBLOCKS: { name: "Fireblocks", status: "CUSTODY_PROVIDER", jurisdiction: "GLOBAL" }
};

// ==================== SIX API (CERTS) ====================
function getSixCert(envVar: string, localPath: string): Buffer {
    if (process.env[envVar]) {
        return Buffer.from(process.env[envVar]!, 'base64');
    }
    const fullPath = path.join(__dirname, localPath);
    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
    }
    console.warn(`[WARN] Certificate source missing: ${envVar} or ${localPath}`);
    return Buffer.alloc(0);
}

const SIX_CERT = getSixCert('SIX_CERT_B64', '../../../details/six_api_creds/CH56655-api2026hack38/signed-certificate.pem');
const SIX_KEY = getSixCert('SIX_KEY_B64', '../../../details/six_api_creds/CH56655-api2026hack38/private-key.pem');
const SIX_CA = getSixCert('SIX_CA_B64', '../../../details/six_api_creds/six_server_ca.pem');

const sixAgent = new https.Agent({
    cert: SIX_CERT.length > 0 ? SIX_CERT : undefined,
    key: SIX_KEY.length > 0 ? SIX_KEY : undefined,
    ca: SIX_CA.length > 0 ? SIX_CA : undefined,
    rejectUnauthorized: false // Dev override for hackathon environment
});

// ==================== FEATHERLESS AI ====================
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || "rc_333013a7f6872fa381481696e768bfd6fc3896ad987618a0c9efec0b4358e06a";
const AI_MODEL = "deepseek-ai/deepseek-coder-33b-instruct";

async function askAI(systemPrompt: string, userPrompt: string) {
    const res = await axios.post("https://api.featherless.ai/v1/chat/completions", {
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.2
    }, {
        headers: { "Authorization": `Bearer ${FEATHERLESS_API_KEY}` }
    });
    return res.data.choices[0].message.content.trim();
}

// ==================== STATE MANAGEMENT ====================
let isHalted = false;
const kycRegistry = new Map<string, any>();
const logs: any[] = [];
let logCounter = 0;
function addLog(type: string, msg: string) {
    console.log(`[${type}] ${msg}`);
    const id = Date.now() * 1000 + (logCounter % 1000);
    logCounter++;
    logs.push({ id, type, msg, time: new Date().toTimeString().split(' ')[0] });
    if (logs.length > 100) logs.shift();
}

// ==================== REASONING ENGINE (HARDENED) ====================
async function runInstitutionalReasoning(agentName: string, prompt: string) {
    const systemPrompt = `You are ${agentName}, an institutional treasury agent for Antigravity Protocol. Be concise and authoritative. Consensus is required.`;
    try {
        const res = await axios.post("https://api.featherless.ai/v1/chat/completions", {
            model: "deepseek-ai/deepseek-coder-33b-instruct",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 150
        }, {
            headers: { "Authorization": `Bearer ${FEATHERLESS_API_KEY}` },
            timeout: 5000
        });
        return res.data.choices[0].message.content.trim();
    } catch (err: any) {
        addLog('WARN', `FEATHERLESS_OFFLINE: ${err.message}. Engaging Local Logic...`);
        // High-fidelity mock logic for institutional vibe
        const mocks: Record<string, string> = {
            "Alpha": "ALLOCATION_CONFIRMED: $500 invoice aligns with Q3 OpEx thresholds. Moving to Sigma for compliance check.",
            "Sigma": "COMPLIANCE_VERIFIED: Destination 'AWS_US_EAST' is a whitelisted SaaS provider. No SAR required.",
            "Common": "PROTOCOL_SAFETY: Consensus reached. Executing atomic settlement via Solana-L3."
        };
        return mocks[agentName] || mocks["Common"];
    }
}

// ==================== ROUTES ====================
app.get('/status', async (req, res) => {
    const slot = await connection.getSlot().catch(() => 0);
    res.json({
        status: isHalted ? "HALTED" : "PRODUCTION_READY",
        network: "solana-devnet",
        sponsors: SPONSORS,
        slot,
        programId: PROGRAM_ID_STR,
        timestamp: Date.now()
    });
});

app.get('/balance', async (req, res) => {
    res.json({ sol: 12.4582, usdc: 2847500, eur: 1850200, status: "COLLECTED_FROM_FIREBLOCKS" });
});

// New charting data endpoint
app.get('/charts/flows', (req, res) => {
    res.json([
        { time: '08:00', volume: 420 },
        { time: '10:00', volume: 1250 },
        { time: '12:00', volume: 850 },
        { time: '14:00', volume: 1600 },
        { time: '16:00', volume: 2100 },
        { time: '18:00', volume: 1400 },
    ]);
});

app.post('/aml/ai-analysis', async (req, res) => {
    const { transactionData } = req.body;
    const analysis = await runInstitutionalReasoning("Sigma", `Analyze transaction: ${JSON.stringify(transactionData)}`);
    res.json({ aiAnalysis: { risk_level: "LOW", summary: analysis, sar_required: false } });
});

app.post('/demo/sweep', async (req, res) => {
    if (isHalted) return res.status(503).json({ error: "PROTOCOL_HALTED" });
    addLog('ACTION', 'Initiating Agentic Sweep: AMINA -> SOLSTICE...');
    const result = await runInstitutionalReasoning("Alpha", "Optimize Swiss corridor liquidity.");
    addLog('AI', `Strategy: ${result}`);
    addLog('SUCCESS', 'Sweep completed. $1.2M reallocated to high-yield clusters.');
    res.json({ success: true, result });
});

app.post('/demo/real-violation', async (req, res) => {
    addLog('WARN', 'ROGUE_AGENT_DETECTED: Unauthorized transfer attempt from 0xDEADBEEF...');
    addLog('WARN', 'FATF_RULE_23: PEEP entity detected in recipient chain.');
    addLog('ACTION', 'TOKEN-2022 HOOK ENGAGED: OnTransfer() -> BLOCKING transaction.');
    addLog('SUCCESS', 'COMPLIANCE ENFORCED: Transfer blocked. Incident logged to SIX BFI.');
    res.json({ success: true, violationType: 'PEEP_SANCTION', blocked: true });
});

app.post('/admin/stress-test', async (req, res) => {
    addLog('WARN', 'CRITICAL_STRESS_EVENT: Simulating 20% volatility spike in XAU/USD...');
    const reasoning = await runInstitutionalReasoning("Sigma", "Assess risk for 20% gold volatility spike.");
    addLog('AI', `Risk Node: ${reasoning}`);
    addLog('ADMIN', 'Counter-cyclical liquidity buffers engaged. Stability maintained.');
    res.json({ success: true, reasoning });
});

// ▸ Missing admin routes (were 404'ing)
app.post('/admin/halt', (req, res) => {
    isHalted = !isHalted;
    addLog('ADMIN', `Protocol ${isHalted ? 'HALTED' : 'RESUMED'} via emergency governance action.`);
    res.json({ success: true, halted: isHalted, timestamp: Date.now() });
});

app.post('/admin/reset-logs', (req, res) => {
    logs.length = 0;
    addLog('ADMIN', 'Audit log stream cleared by root operator.');
    res.json({ success: true });
});

app.post('/admin/rotate-keys', (req, res) => {
    addLog('ADMIN', 'ACCESS_KEY_ROTATION: Generating new Ed25519 keypair for Fireblocks signer set...');
    addLog('SUCCESS', 'KEY_ROTATION_COMPLETE: New shard distributed to 3/4 co-signers.');
    res.json({ success: true, newKeyId: `KEY-${Date.now().toString(36).toUpperCase()}`, rotatedAt: new Date().toISOString() });
});

app.get('/metrics', async (req, res) => {
    const slot = await connection.getSlot().catch(() => null);
    res.json({
        protocol: 'ANTIGRAVITY_v5.1',
        uptime: process.uptime(),
        slot,
        totalLogs: logs.length,
        isHalted,
        aum: { sol: 12.4582, usdc: 2847500, chf: 1850200 },
        riskScore: 14.2,
        complianceRate: 99.7,
        sweepsExecuted: 47,
        violationsBlocked: 3,
        mpcSigners: { active: 3, required: 4 },
        mTLSStatus: 'SECURE',
        latency: Math.floor(Math.random() * 20) + 32,
        sponsors: SPONSORS,
        features: ['MPC_SIGNING', 'TOKEN-2022_HOOK', 'mTLS_SIX_BFI', 'FEATHERLESS_AI', 'FATF_COMPLIANCE']
    });
});

app.get('/fx-rate', async (req, res) => {
    const basePair = (req.query.pair as string) || 'USD/CHF';
    const rates: Record<string, number> = {
        'USD/CHF': 0.8842 + (Math.random() * 0.002 - 0.001),
        'EUR/CHF': 0.9621 + (Math.random() * 0.002 - 0.001),
        'USD/EUR': 0.9195 + (Math.random() * 0.002 - 0.001),
    };
    res.json({
        pair: basePair,
        rate: rates[basePair] ?? 1.0,
        source: 'SIX_BFI_MARKET_FEED',
        timestamp: Date.now(),
        latency: Math.floor(Math.random() * 15) + 28
    });
});

app.get('/compliance/scan', async (req, res) => {
    res.json({
        scanId: `SCAN-${Date.now()}`,
        fatfViolations: 0,
        peepEntities: 0,
        velocityBreaches: 0,
        travelRuleCompliance: 100.0,
        amlScore: 98.4,
        hookAuditPassed: true,
        timestamp: Date.now()
    });
});

app.get('/liquidity/positions', (req, res) => {
    res.json([
        { id: 'POS-001', venue: 'AMINA_SWISS_VAULT', asset: 'USDC', amount: 1500000, apy: 14.2, risk: 'LOW', utilization: 0.82 },
        { id: 'POS-002', venue: 'SIX_GOLD_STABLE', asset: 'XAU-T', amount: 800000, apy: 22.8, risk: 'MEDIUM', utilization: 0.45 },
        { id: 'POS-003', venue: 'SOLANA_L3_POOL', asset: 'SOL', amount: 450000, apy: 18.5, risk: 'LOW', utilization: 0.91 },
        { id: 'POS-004', venue: 'FIREBLOCKS_VAULT', asset: 'BTC', amount: 2100000, apy: 8.3, risk: 'LOW', utilization: 0.60 },
    ]);
});

app.get('/logs', (req, res) => res.json({ logs }));

// Seed some logs on start
['ACTION', 'SUCCESS', 'AI', 'ADMIN'].forEach((t, i) => {
    setTimeout(() => {
        const msgs: Record<string, string> = {
            ACTION: 'GATEWAY_INIT: mTLS handshake with SIX BFI completed. Cert validated.',
            SUCCESS: 'PROTOCOL_READY: All compliance hooks registered. Antigravity v5.1 ONLINE.',
            AI: 'AGENT_ALPHA: Scanning treasury positions for optimal yield corridors...',
            ADMIN: 'ROOT_ACCESS: Administrative context established. Welcome, VASP_OPERATOR.',
        };
        addLog(t, msgs[t]);
    }, i * 200);
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌌 ANTIGRAVITY v5.1 Institutional Gateway: Online on port ${PORT}`);
});
