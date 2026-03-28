import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../config';
import {
  Shield, Brain, Terminal, Activity, AlertTriangle, CheckCircle,
  Cpu, X, ChevronRight, RefreshCw, Search, Zap, Eye
} from 'lucide-react';

interface Log { id: number; type: string; msg: string; time: string; }

const Pill = ({ label, value, color = '#999' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color }}>{value}</span>
  </div>
);

const SwarmNode = ({ name, status, color, active }: { name: string; status: string; color: string; active: boolean; }) => (
  <div
    className="glass-card"
    style={{ padding: '14px', borderLeft: `2px solid ${active ? color : '#181818'}`, cursor: 'default', transition: 'all 0.3s' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <span className="label-xs" style={{ color: active ? '#ccc' : 'var(--text-dim)' }}>{name}</span>
      <div className={`status-dot${active ? ' active' : ''}`} style={{ background: active ? color : '#222', boxShadow: active ? `0 0 6px ${color}` : 'none' }} />
    </div>
    <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 900, color: active ? color : '#333', transition: 'color 0.3s' }}>{status}</div>
  </div>
);

const FatfMatrix = ({ onClick }: { onClick: () => void }) => {
  const violations = [
    { type: 'PEEP_SANCTION', count: 0, status: 'CLEAN', color: 'var(--success)' },
    { type: 'VELOCITY_BREACH', count: 0, status: 'CLEAN', color: 'var(--success)' },
    { type: 'ROGUE_AGENT_K7', count: 3, status: 'BLOCKED', color: 'var(--danger)' },
    { type: 'TRAVEL_RULE_MISS', count: 0, status: 'COMPLIANT', color: 'var(--success)' },
    { type: 'AML_THRESHOLD', count: 0, status: 'WITHIN_LIMITS', color: 'var(--success)' },
  ];
  return (
    <div className="glass-card clickable" data-coord="FATF" onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Shield size={14} color="var(--success)" />
        <span className="label-sm">FATF_VIOLATION_MATRIX</span>
        <ChevronRight size={12} color="var(--text-dim)" style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {violations.map((v, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0d0d0d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="status-dot" style={{ background: v.color, boxShadow: `0 0 4px ${v.color}`, width: '5px', height: '5px' }} />
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)' }}>{v.type}</span>
            </div>
            <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: v.color }}>{v.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ComplianceCenter = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [swarmStatus, setSwarmStatus] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [hookHistory, setHookHistory] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [violationCount, setViolationCount] = useState(3);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/logs`);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const runSwarm = async () => {
    setIsOrchestrating(true);
    setSwarmStatus('ALPHA: PARSING_LIQUIDITY_DEPTH...');
    try {
      await fetch(`${API_URL}/demo/sweep`, { method: 'POST' });
      setTimeout(() => setSwarmStatus('BETA: CROSS-REFERENCING_FATF_LISTS...'), 1200);
      setTimeout(() => setSwarmStatus('OMEGA: SETTLEMENT_FINALIZED_v5.1'), 2400);
      setTimeout(() => { setSwarmStatus(null); setIsOrchestrating(false); }, 5000);
    } catch { setIsOrchestrating(false); }
  };

  const triggerViolation = async () => {
    try {
      await fetch(`${API_URL}/demo/real-violation`, { method: 'POST' });
      setViolationCount(c => c + 1);
      setHookHistory(h => [`[${new Date().toTimeString().slice(0, 8)}] BLOCKED: 0xDEADBEEF → PEEP_SANCTION`, ...h.slice(0, 9)]);
    } catch {}
  };

  const runScan = async () => {
    try {
      const res = await fetch(`${API_URL}/compliance/scan`);
      setScanResult(await res.json());
      setModal('SCAN_RESULT');
    } catch {}
  };

  const filteredLogs = logs.filter(l => !search || l.msg.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase()));

  const logColor = (type: string) => {
    if (type === 'WARN') return 'var(--danger)';
    if (type === 'AI') return 'var(--primary)';
    if (type === 'SUCCESS') return 'var(--success)';
    return 'var(--text-muted)';
  };

  return (
    <div className="animate-fade-in dashboard-container" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="section-title">COMPLIANCE // GATE v5.1</h2>
          <p className="section-subtitle">// TOKEN-2022_HOOK_ENFORCEMENT · FATF_EDD · MULTI-AGENT_SWARM_ORCHESTRATION</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={fetchLogs}><RefreshCw size={11} style={{ display: 'inline', marginRight: 6 }} />SYNC</button>
          <button className="btn-primary" onClick={runScan}>COMPLIANCE_SCAN</button>
          <button className="btn-primary" onClick={runSwarm} disabled={isOrchestrating}>
            {isOrchestrating ? 'ORCHESTRATING...' : 'RUN_SWARM_LOGIC'}
          </button>
          <button className="btn-danger" onClick={triggerViolation}>SIMULATE_ROGUE_AI</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Swarm Grid */}
          <div className="glass-card" data-coord="SWARM">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Brain size={16} color="var(--primary)" />
              <span className="label-sm">AI_SWARM_ORCHESTRATION_GRID</span>
              {isOrchestrating && <div className="status-dot active" style={{ marginLeft: 'auto' }} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <SwarmNode name="ALPHA_REASONER" status={isOrchestrating ? 'SCANNING' : 'STANDBY'} color="var(--primary)" active={isOrchestrating} />
              <SwarmNode name="BETA_RISK_AUDIT" status={swarmStatus?.startsWith('BETA') ? 'ANALYZING' : 'IDLE'} color="var(--warning)" active={!!swarmStatus?.startsWith('BETA')} />
              <SwarmNode name="OMEGA_SETTLER" status={swarmStatus?.startsWith('OMEGA') ? 'FINALIZING' : 'IDLE'} color="var(--success)" active={!!swarmStatus?.startsWith('OMEGA')} />
            </div>
            {swarmStatus ? (
              <div style={{ background: '#050505', padding: '20px', border: '1px solid var(--primary)', position: 'relative' }}>
                <div className="data-grid-overlay" />
                <div className="label-xs" style={{ marginBottom: '8px', color: 'var(--primary)', position: 'relative', zIndex: 1 }}>// AGENT_REASONING_STREAM</div>
                <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 800, color: '#fff', fontSize: '0.8rem', position: 'relative', zIndex: 1 }}>{swarmStatus}</div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '4px', position: 'relative', zIndex: 1 }}>
                  {[1, 0, 1, 1, 0, 1, 0, 1, 1].map((p, i) => (
                    <div key={i} style={{ height: '2px', flex: 1, background: p ? 'var(--primary)' : '#111' }} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#111', background: '#030303', border: '1px dashed #161616' }}>
                <Cpu size={24} style={{ opacity: 0.08, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontWeight: 900, fontSize: '0.6rem', fontFamily: 'var(--terminal-font)', letterSpacing: '2px', color: '#222' }}>AWAITING_ORCHESTRATION_SIGNAL</p>
              </div>
            )}
          </div>

          {/* Bottom: FATF + Hook State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FatfMatrix onClick={() => setModal('FATF_DETAIL')} />
            <div className="glass-card clickable" data-coord="HOOK" onClick={() => setModal('HOOK_DETAIL')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Activity size={14} color="var(--primary)" />
                <span className="label-sm">TOKEN-2022_HOOK</span>
                <ChevronRight size={12} color="var(--text-dim)" style={{ marginLeft: 'auto' }} />
              </div>
              <div style={{ background: '#030303', padding: '12px', border: '1px solid #111', fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', color: 'var(--primary)', marginBottom: '12px' }}>
                // ON_TRANSFER(sender, rcvr, amt)<br />
                {'→ VALIDATE_mTLS(SIX_BFI)'}<br />
                {'→ CHECK_FATF_LIST(sender)'}<br />
                {'→ ENFORCE_TRAVEL_RULE()'}
              </div>
              <Pill label="VIOLATIONS_BLOCKED" value={`${violationCount}`} color="var(--danger)" />
              <Pill label="HOOK_STATUS" value="REGISTERED" color="var(--success)" />
              {hookHistory.length > 0 && (
                <div style={{ marginTop: '10px', fontFamily: 'var(--terminal-font)', fontSize: '0.5rem', color: 'var(--danger)', background: '#050505', border: '1px solid #111', padding: '8px', maxHeight: '60px', overflowY: 'auto' }}>
                  {hookHistory.map((h, i) => <div key={i}>{h}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Full Audit Log ── */}
        <div className="glass-card" data-coord="LOG_STREAM" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={16} color="var(--primary)" />
              <span className="label-sm">PROTOCOL_AUDIT_STREAM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="status-dot active" />
              <span className="label-xs" style={{ color: 'var(--success)' }}>LIVE</span>
            </div>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', border: '1px solid #181818', padding: '8px 12px' }}>
            <Search size={12} color="var(--text-dim)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', color: 'var(--text)', width: '100%', letterSpacing: '1px' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                <X size={11} />
              </button>
            )}
          </div>

          <div ref={scrollRef} className="terminal-block" style={{ flex: 1, maxHeight: '640px', overflowY: 'auto' }}>
            <div className="data-grid-overlay" />
            {filteredLogs.length === 0 && (
              <div style={{ color: '#222', textAlign: 'center', marginTop: '80px', fontWeight: 900, fontSize: '0.6rem', letterSpacing: '2px' }}>SYNCING_LEDGER...</div>
            )}
            {filteredLogs.map((log, i) => (
              <div
                key={`${log.id}-${i}`}
                className="terminal-line"
                style={{ borderLeft: `2px solid ${logColor(log.type)}`, paddingLeft: '12px', cursor: 'pointer', position: 'relative', zIndex: 1 }}
                onClick={() => setModal(`LOG_${log.id}`)}
                onMouseEnter={e => (e.currentTarget.style.background = '#0f0f0f')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="terminal-time">[{log.time}]</span>
                <span className="terminal-type" style={{ color: logColor(log.type) }}>//{log.type}</span>
                <span className="terminal-msg" style={{ color: log.type === 'WARN' ? 'var(--danger)' : log.type === 'SUCCESS' ? 'var(--success)' : 'var(--text)' }}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontFamily: 'var(--terminal-font)', fontSize: '0.5rem', color: 'var(--text-dim)', borderTop: '1px solid #111', paddingTop: '8px' }}>
            {filteredLogs.length} EVENTS · POLL: 2s
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'FATF_DETAIL' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '2px' }}>FATF // COMPLIANCE_MATRIX</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <Pill label="TRAVEL_RULE_COMPLIANCE" value="100.0%" color="var(--success)" />
            <Pill label="EDD_ENHANCED_DUE_DILIGENCE" value="ACTIVE" color="var(--success)" />
            <Pill label="PEEP_SCREENING" value="REAL-TIME" color="var(--primary)" />
            <Pill label="SAR_REPORTS_FILED" value="0" color="var(--success)" />
            <Pill label="JURISDICTION" value="CH · FINMA_REGULATED" color="var(--text)" />
            <Pill label="LAST_AUDIT" value="2026-03-28" color="var(--text-muted)" />
          </div>
        </div>
      )}
      {modal === 'HOOK_DETAIL' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '2px' }}>TOKEN-2022 // TRANSFER_HOOK</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <Pill label="HOOK_PROGRAM_ID" value="Heh9pGU...rG" color="var(--primary)" />
            <Pill label="MINT_EXTENSION" value="TransferHook v2.0" color="var(--text)" />
            <Pill label="EXTRA_ACCOUNT_METAS" value="3 VALIDATED" color="var(--success)" />
            <Pill label="ON_TRANSFER_LOGIC" value="FATF + mTLS + RISK" color="var(--primary)" />
            <Pill label="VIOLATIONS_BLOCKED" value={`${violationCount}`} color="var(--danger)" />
            <Pill label="GAS_ESTIMATE" value="~0.000005 SOL" color="var(--text-muted)" />
          </div>
        </div>
      )}
      {modal === 'SCAN_RESULT' && scanResult && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '2px' }}>COMPLIANCE_SCAN // RESULTS</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <Pill label="SCAN_ID" value={scanResult.scanId} color="var(--primary)" />
            <Pill label="FATF_VIOLATIONS" value={`${scanResult.fatfViolations}`} color={scanResult.fatfViolations === 0 ? 'var(--success)' : 'var(--danger)'} />
            <Pill label="TRAVEL_RULE" value={`${scanResult.travelRuleCompliance}%`} color="var(--success)" />
            <Pill label="AML_SCORE" value={`${scanResult.amlScore}`} color="var(--success)" />
            <Pill label="HOOK_AUDIT" value={scanResult.hookAuditPassed ? '✓ PASSED' : '✗ FAILED'} color={scanResult.hookAuditPassed ? 'var(--success)' : 'var(--danger)'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceCenter;
