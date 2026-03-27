import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity, Brain, TrendingUp, Users } from 'lucide-react';

const ComplianceCenter = () => {
    const [testInProgress, setTestInProgress] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [predictiveRisk, setPredictiveRisk] = useState<any>(null);
    const [complianceAdvisory, setComplianceAdvisory] = useState<any>(null);
    const [violationResult, setViolationResult] = useState<any>(null);

    const getLogTime = (offsetMinutes: number) => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - offsetMinutes);
        return d.toTimeString().split(' ')[0];
    };

    const [logs, setLogs] = useState([
        { id: 1, type: 'INFO', msg: 'Antigravity VASP Node Online', time: getLogTime(15) },
        { id: 2, type: 'INFO', msg: 'Handshaking with Devnet Program EiCCdPf5...', time: getLogTime(14) },
        { id: 3, type: 'INFO', msg: 'ExtraAccountMetaList synced for Mint AG-USD', time: getLogTime(12) },
        { id: 4, type: 'DEBUG', msg: 'Awaiting institutional transfers...', time: getLogTime(10) },
    ]);

    const addLog = (type: string, msg: string) => {
        setLogs(prev => [...prev, { id: Date.now(), type, msg, time: new Date().toTimeString().split(' ')[0] }]);
    };

    const runRealDemo = async () => {
        setTestInProgress(true);
        setViolationResult(null);
        addLog('ACTION', 'Triggering real violation demo (0x1770)...');
        try {
            const response = await fetch('http://localhost:3001/demo/real-violation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            setViolationResult(data);
            addLog('BLOCK', `Protocol revert: ${data.error_code} — ${data.reason}`);
        } catch (err) {
            addLog('WARN', 'Demo endpoint unreachable — start compliance-gateway on port 3001');
        } finally {
            setTestInProgress(false);
        }
    };

    const runAIAnalysis = async () => {
        addLog('ACTION', 'Running AI AML pattern analysis...');
        try {
            const response = await fetch('http://localhost:3001/aml/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionData: {
                        id: 'sample_tx_' + Date.now(),
                        amount: 5000000,
                        currency: 'USD',
                        sender: 'amina_0x123',
                        receiver: 'ubs_chf_0x456',
                        timestamp: new Date().toISOString(),
                    },
                    historicalPattern: [
                        { amount: 1000000, timestamp: new Date(Date.now() - 86400000).toISOString() },
                        { amount: 2000000, timestamp: new Date(Date.now() - 43200000).toISOString() },
                    ],
                }),
            });
            const data = await response.json();
            setAiAnalysis(data.aiAnalysis || data);
            addLog('AI', `AI Analysis Complete: risk_level=${data.aiAnalysis?.risk_level || 'N/A'}`);
        } catch (err) {
            addLog('WARN', 'AI Analysis failed — check compliance-gateway');
        }
    };

    const runPredictiveRisk = async () => {
        addLog('ACTION', 'Running predictive risk scoring...');
        try {
            const response = await fetch('http://localhost:3001/aml/predictive-risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityData: {
                        id: 'entity_' + Date.now(),
                        name: 'Sample Institution',
                        jurisdiction: 'CH',
                        type: 'bank',
                    },
                    networkData: [
                        { connected_entity: 'ubs_ag', risk_level: 'LOW', relationship: 'correspondent' },
                        { connected_entity: 'amina_bank', risk_level: 'LOW', relationship: 'partner' },
                    ],
                }),
            });
            const data = await response.json();
            setPredictiveRisk(data.predictiveRisk || data);
            addLog('RISK', `Predictive Risk: category=${data.predictiveRisk?.risk_category || 'N/A'}`);
        } catch (err) {
            addLog('WARN', 'Predictive Risk failed — check compliance-gateway');
        }
    };

    const runComplianceAdvisory = async () => {
        addLog('ACTION', 'Fetching compliance advisory for CH jurisdiction...');
        try {
            const response = await fetch('http://localhost:3001/compliance/advisory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionData: {
                        id: 'tx_' + Date.now(),
                        amount: 1000000,
                        currency: 'USD',
                        type: 'cross_border',
                    },
                    jurisdiction: 'CH',
                }),
            });
            const data = await response.json();
            setComplianceAdvisory(data.complianceAdvisory || data);
            addLog('ADVISORY', `Advisory received for jurisdiction: ${data.jurisdiction || 'CH'}`);
        } catch (err) {
            addLog('WARN', 'Compliance Advisory failed — check compliance-gateway');
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>Compliance Center</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Protocol-level Travel Rule enforcement via Token-2022 Transfer Hooks.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        className="btn-primary"
                        onClick={runRealDemo}
                        disabled={testInProgress}
                        style={{ background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Shield size={18} /> Trigger Real Violation Demo
                    </button>
                    <button
                        className="btn-primary"
                        onClick={runAIAnalysis}
                        style={{ background: '#6366f1', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Brain size={18} /> AI Pattern Analysis
                    </button>
                    <button
                        className="btn-primary"
                        onClick={runPredictiveRisk}
                        style={{ background: '#a855f7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <TrendingUp size={18} /> Predictive Risk
                    </button>
                    <button
                        className="btn-primary"
                        onClick={runComplianceAdvisory}
                        style={{ background: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Users size={18} /> Compliance Advisory
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px' }}>Protocol Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CheckCircle size={20} color="#10b981" />
                            <span>ExtraAccountMeta: SYNCED</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CheckCircle size={20} color="#10b981" />
                            <span>VASP Oracle: ONLINE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Activity size={20} color="#6366f1" />
                            <span>Slot Latency: 38ms</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Core Program ID</div>
                        <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--primary)' }}>EiCCdPf5QBvVbywubi6LdgPeC5RbL4Qef5KV4ScUj9hy</code>
                    </div>
                    {violationResult && (
                        <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, marginBottom: '4px' }}>
                                {violationResult.error_code} — BLOCKED
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{violationResult.reason}</div>
                        </div>
                    )}
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px' }}>AI AML Agent Results</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {aiAnalysis && (
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Brain size={16} color="#6366f1" />
                                    <span style={{ fontWeight: 600 }}>Pattern Analysis</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                    Risk Level: {aiAnalysis.risk_level || 'N/A'} | Probability: {aiAnalysis.risk_probability ?? 'N/A'}% | SAR Required: {aiAnalysis.sar_required ? 'YES' : 'NO'}
                                </div>
                            </div>
                        )}
                        {predictiveRisk && (
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <TrendingUp size={16} color="#a855f7" />
                                    <span style={{ fontWeight: 600 }}>Predictive Risk</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                    Score: {predictiveRisk.predictive_risk_score ?? 'N/A'} | Category: {predictiveRisk.risk_category || 'N/A'} | Monitoring: {predictiveRisk.monitoring_level || 'N/A'}
                                </div>
                            </div>
                        )}
                        {complianceAdvisory && (
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Users size={16} color="#10b981" />
                                    <span style={{ fontWeight: 600 }}>Compliance Advisory</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                    Travel Rule: {complianceAdvisory.travel_rule_required ? 'REQUIRED' : 'NOT REQUIRED'} | EDD: {complianceAdvisory.edd_required ? 'YES' : 'NO'} | Record Keeping: {complianceAdvisory.record_keeping_days ?? 'N/A'} days
                                </div>
                            </div>
                        )}
                        {!aiAnalysis && !predictiveRisk && !complianceAdvisory && (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                                <Brain size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <div>Run AI AML analysis to see results here</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>VASP@antigravity:~/logs</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981' }}>● LIVE_RECEIPT_MODE</span>
                    </div>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {logs.slice(-15).map(log => (
                        <div key={log.id} style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                            <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>[{log.time}]</span>
                            <span style={{
                                color: log.type === 'WARN' || log.type === 'BLOCK' ? '#ef4444' :
                                       log.type === 'PASS' || log.type === 'INFO' ? '#10b981' :
                                       log.type === 'ACTION' ? '#6366f1' :
                                       log.type === 'LINK' ? '#60a5fa' : '#fff',
                                fontWeight: log.type === 'BLOCK' ? 800 : 400
                            }}>
                                {log.type}: {log.msg}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ComplianceCenter;
