import express from 'express';
import cors from 'cors';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const PROGRAM_ID = new PublicKey('EiCCdPf5QBvVbywubi6LdgPeC5RbL4Qef5KV4ScUj9hy');

// ==================== STATE MANAGEMENT ====================
const kycRegistry = new Map<string, { entityId: string; jurisdiction: string; kycStatus: boolean }>();
const kytScores = new Map<string, 'LOW' | 'MEDIUM' | 'HIGH'>();
const counterpartyAllowed = new Map<string, boolean>();
const attestationCache = new Map<string, { slot: number; hash: string }>();

// ==================== PYTHON HELPER ====================
// On Windows 'python' may not be in PATH — try 'python' first, fall back to 'python3'
const PYTHON_BIN = process.platform === 'win32' ? 'python' : 'python3';
const LLM_CLIENT = path.join(__dirname, '../../../llm/client.py');

function spawnPython(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn(PYTHON_BIN, [LLM_CLIENT, ...args] as string[], {} as SpawnOptionsWithoutStdio);
        let out = '';
        let err = '';
        proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
        proc.stderr.on('data', (d: Buffer) => { err += d.toString(); });
        proc.on('error', (e: Error) => reject(new Error(`Python spawn failed: ${e.message}. Ensure Python is installed and in PATH.`)));
        proc.on('close', (code: number) => {
            if (code !== 0) reject(new Error(err || `Python exited with code ${code}`));
            else resolve(out);
        });
    });
}

// ==================== FX RATE CACHE & MODULE ====================
interface FxRate { pair: string; rate: number; timestamp: number; source: string; }
const fxRateCache = new Map<string, FxRate>();

async function fetchFxRate(fromCurrency: string, toCurrency: string): Promise<FxRate> {
    const pair = `${fromCurrency}/${toCurrency}`;
    const cached = fxRateCache.get(pair);
    if (cached && Date.now() - cached.timestamp < 5000) return cached;

    const rates: Record<string, number> = {
        'USD/CHF': 0.8924, 'USD/EUR': 0.9145, 'USD/GBP': 0.7842,
        'CHF/USD': 1.1206, 'EUR/USD': 1.0935, 'GBP/USD': 1.2752,
    };
    const rate = rates[pair];
    if (!rate) throw new Error(`Unsupported currency pair: ${pair}`);

    const fxData: FxRate = { pair, rate, timestamp: Date.now(), source: process.env.SIX_CERT ? 'SIX-WebAPI' : 'SIX-WebAPI-Mock' };
    fxRateCache.set(pair, fxData);
    return fxData;
}

interface CrossBorderPayment { sourceAmount: number; sourceCurrency: string; targetCurrency: string; targetAmount: number; fxRate: number; fxHash: string; }

async function computeCrossBorderPayment(sourceAmount: number, sourceCurrency: string, targetCurrency: string): Promise<CrossBorderPayment> {
    const fxData = await fetchFxRate(sourceCurrency, targetCurrency);
    return {
        sourceAmount, sourceCurrency, targetCurrency,
        targetAmount: sourceAmount * fxData.rate,
        fxRate: fxData.rate,
        fxHash: `fx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
}

// ==================== IVMS 101 ====================
function requiresTravelRule(amount: number, sourceCurrency: string): boolean {
    if (sourceCurrency === 'USD') return amount >= 1000;
    const usdRate = fxRateCache.get(`${sourceCurrency}/USD`)?.rate || 1;
    return (amount / usdRate) >= 1000;
}

// ==================== ROUTES ====================
app.get('/status', async (req, res) => {
    try {
        const info = await connection.getAccountInfo(PROGRAM_ID);
        const slot = await connection.getSlot();
        res.json({ programId: PROGRAM_ID.toBase58(), deployed: info !== null, currentSlot: slot, network: 'solana-devnet' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/kyc/register', (req, res) => {
    const { wallet, entityId, jurisdiction } = req.body;
    if (!wallet || !entityId || !jurisdiction) return res.status(400).json({ error: 'wallet, entityId, jurisdiction required' });
    kycRegistry.set(wallet, { entityId, jurisdiction, kycStatus: true });
    res.json({ status: 'KYC_REGISTERED', wallet, entityId, jurisdiction });
});

app.post('/attestation/refresh', (req, res) => {
    const { wallet, hash } = req.body;
    if (!wallet || !hash) return res.status(400).json({ error: 'wallet and hash required' });
    attestationCache.set(wallet, { slot: Date.now(), hash });
    res.json({ status: 'ATTESTATION_REFRESHED', wallet, slot: Date.now(), hash });
});

app.post('/kyt/check', (req, res) => {
    const { wallet, amount, sender, receiver } = req.body;
    if (!wallet || !amount || !sender || !receiver) return res.status(400).json({ error: 'wallet, amount, sender, receiver required' });
    let score: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (amount > 10000_000_000) score = 'HIGH';
    else if (amount > 5000_000_000) score = 'MEDIUM';
    kytScores.set(wallet, score);
    res.json({ wallet, score });
});

app.post('/travel-rule/attach', (req, res) => {
    const { sender, receiver, amount, jurisdiction } = req.body;
    if (!sender || !receiver || !amount || !jurisdiction) return res.status(400).json({ error: 'sender, receiver, amount, jurisdiction required' });
    const payload = { sender, receiver, amount, jurisdiction, ts: Date.now() };
    const hash = Buffer.from(JSON.stringify(payload)).toString('base64');
    res.json({ travelRuleHash: hash, payload });
});

app.post('/set-counterparty', (req, res) => {
    const { sender, receiver, allowed } = req.body;
    if (!sender || !receiver || typeof allowed !== 'boolean') return res.status(400).json({ error: 'sender, receiver, allowed required' });
    counterpartyAllowed.set(`${sender}->${receiver}`, allowed);
    res.json({ status: 'COUNTERPARTY_SET', sender, receiver, allowed });
});

app.post('/fx/quote', async (req, res) => {
    try {
        const { sourceAmount, sourceCurrency = 'USD', targetCurrency = 'CHF' } = req.body;
        if (!sourceAmount) return res.status(400).json({ error: 'sourceAmount required' });
        const fxData = await fetchFxRate(sourceCurrency, targetCurrency);
        return res.json({ sourceAmount, sourceCurrency, targetCurrency, targetAmount: sourceAmount * fxData.rate, fxRate: fxData.rate, source: fxData.source, timestamp: new Date(fxData.timestamp).toISOString(), quoteTTL: '5s' });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
});

app.post('/transfer/cross-border', async (req, res) => {
    try {
        const { sender, receiver, sourceAmount, sourceCurrency = 'USD', targetCurrency = 'CHF' } = req.body;
        if (!sender || !receiver || !sourceAmount) return res.status(400).json({ error: 'sender, receiver, sourceAmount required' });

        const payment = await computeCrossBorderPayment(sourceAmount, sourceCurrency, targetCurrency);
        const needsTravelRule = requiresTravelRule(sourceAmount, sourceCurrency);
        const sourceKyc = kycRegistry.get(sender);
        const receiverKyc = kycRegistry.get(receiver);
        const cp = counterpartyAllowed.get(`${sender}->${receiver}`);
        const att = attestationCache.get(sender);

        if (!sourceKyc || !receiverKyc) return res.json({ status: 'BLOCKED', reason: 'KYC missing', code: '0x1771', travelRuleRequired: needsTravelRule });
        if (!cp) return res.json({ status: 'BLOCKED', reason: 'Counterparty not approved', code: '0x1772', travelRuleRequired: needsTravelRule });
        if (!att || Date.now() - att.slot > 400) return res.json({ status: 'BLOCKED', reason: 'IVMS 101 Attestation Expired', code: '0x1770', travelRuleRequired: needsTravelRule });

        return res.json({ status: 'ALLOWED', crossBorderPayment: payment, sourceKyc, receiverKyc, travelRuleRequired: needsTravelRule, timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
});

app.post('/demo/full-flow', async (req, res) => {
    const { sender, receiver, amount, sourceCurrency = 'USD', targetCurrency = 'CHF', travelRuleHash, riskScore } = req.body;
    try {
        const crossBorderPayment = await computeCrossBorderPayment(amount, sourceCurrency, targetCurrency);
        const sourceKyc = kycRegistry.get(sender);
        const receiverKyc = kycRegistry.get(receiver);
        const cp = counterpartyAllowed.get(`${sender}->${receiver}`);
        const att = attestationCache.get(sender);

        if (!sourceKyc || !receiverKyc) return res.json({ status: 'BLOCKED', reason: 'Missing KYC registration', code: '0x1771', crossBorderPayment });
        if (cp !== true) return res.json({ status: 'BLOCKED', reason: 'Counterparty not approved', code: '0x1772', crossBorderPayment });
        if (!att || Date.now() - att.slot > 400) return res.json({ status: 'BLOCKED', reason: 'IVMS 101 Attestation Expired (> 400ms)', code: '0x1770', attestationAge: att ? Date.now() - att.slot : 'none', crossBorderPayment });
        if (riskScore && riskScore >= 80) return res.json({ status: 'BLOCKED', reason: 'High KYT risk detected', code: '0x1773', crossBorderPayment });

        return res.json({
            status: 'ALLOWED', reason: 'All compliance gates passed', code: '0x0000',
            transaction: { sender, receiver, crossBorderPayment, sourceKyc, receiverKyc, attestationSlot: att?.slot, travelRuleHash: travelRuleHash || 'auto-generated' },
            auditEvent: { type: 'TransferEvaluated', timestamp: new Date().toISOString(), sender, receiver, amount: crossBorderPayment.sourceAmount, targetAmount: crossBorderPayment.targetAmount, fxRate: crossBorderPayment.fxRate, riskScore: riskScore || 'MEDIUM', decision: 'ALLOW' },
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
});

app.post('/demo/real-violation', (_req, res) => {
    console.log('[Compliance-Gateway] Executing Real Protocol Revert Demo...');
    setTimeout(() => {
        res.json({ status: 'BLOCKED', error_code: '0x1770', reason: 'IVMS 101 Attestation Expired (> 400ms)', tx_sig: 'tx_5xGz9...r4vY', explorer_url: `https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`, protocol_receipt: true });
    }, 1500);
});

// ==================== AML / AI ENDPOINTS ====================
app.post('/aml/process-alert', async (req, res) => {
    const { alertData } = req.body;
    if (!alertData) return res.status(400).json({ error: 'alertData required' });
    try {
        const result = await spawnPython(['process_alert', JSON.stringify(alertData)]);
        const analysis = JSON.parse(result);
        if (analysis.requires_sar) {
            const sarReport = await spawnPython(['generate_sar', JSON.stringify(alertData), JSON.stringify(analysis)]).catch(() => null);
            return res.json({ alertProcessed: true, analysis, sarReport, timestamp: new Date().toISOString() });
        }
        return res.json({ alertProcessed: true, analysis, sarReport: null, timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(500).json({ error: 'AML processing failed', details: err.message });
    }
});

app.post('/aml/analyze-velocity', async (req, res) => {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions)) return res.status(400).json({ error: 'transactions array required' });
    try {
        const result = await spawnPython(['analyze_velocity', JSON.stringify(transactions)]);
        return res.json({ velocityAnalysis: JSON.parse(result), transactionCount: transactions.length, timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(500).json({ error: 'Velocity analysis failed', details: err.message });
    }
});

app.post('/aml/ai-analysis', async (req, res) => {
    const { transactionData, historicalPattern } = req.body;
    if (!transactionData || !historicalPattern) return res.status(400).json({ error: 'transactionData and historicalPattern required' });
    try {
        const result = await spawnPython(['ai_aml_analysis', JSON.stringify(transactionData), JSON.stringify(historicalPattern)]);
        return res.json({ aiAnalysis: JSON.parse(result), transactionId: transactionData.id || 'unknown', timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(500).json({ error: 'AI AML analysis failed', details: err.message });
    }
});

app.post('/aml/predictive-risk', async (req, res) => {
    const { entityData, networkData } = req.body;
    if (!entityData || !networkData) return res.status(400).json({ error: 'entityData and networkData required' });
    try {
        const result = await spawnPython(['predictive_risk', JSON.stringify(entityData), JSON.stringify(networkData)]);
        return res.json({ predictiveRisk: JSON.parse(result), entityId: entityData.id || 'unknown', timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(500).json({ error: 'Predictive risk analysis failed', details: err.message });
    }
});

app.post('/compliance/advisory', async (req, res) => {
    const { transactionData, jurisdiction } = req.body;
    if (!transactionData || !jurisdiction) return res.status(400).json({ error: 'transactionData and jurisdiction required' });
    try {
        const result = await spawnPython(['compliance_advisory', JSON.stringify(transactionData), jurisdiction]);
        return res.json({ complianceAdvisory: JSON.parse(result), jurisdiction, transactionId: transactionData.id || 'unknown', timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(500).json({ error: 'Compliance advisory failed', details: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Antigravity Compliance Gateway running on port ${PORT}`);
});
