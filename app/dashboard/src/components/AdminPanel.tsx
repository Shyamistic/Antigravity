import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, Power, RotateCcw, Lock, AlertTriangle, Terminal, Key,
  Activity, Clock, ChevronRight, X, RefreshCw, Zap, BarChart2
} from 'lucide-react';

interface Log { id: number; type: string; msg: string; time: string; }

const Pill = ({ label, value, color = '#999' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color }}>{value}</span>
  </div>
);

const ActionButton = ({
  label, description, onClick, color = 'var(--primary)', icon: Icon, disabled = false
}: {
  label: string; description: string; onClick: () => void;
  color?: string; icon?: any; disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
      background: 'transparent', border: `1px solid ${disabled ? '#181818' : '#222'}`,
      padding: '14px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s', textAlign: 'left',
    }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = color; }}
    onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = '#222'; }}
  >
    {Icon && <Icon size={14} color={disabled ? '#333' : color} />}
    <div>
      <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color: disabled ? '#333' : color, letterSpacing: '1px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', color: 'var(--text-dim)', marginTop: '2px' }}>{description}</div>
    </div>
    <ChevronRight size={12} color={disabled ? '#222' : color} style={{ marginLeft: 'auto', flexShrink: 0 }} />
  </button>
);

const AdminPanel = () => {
  const [isHalted, setIsHalted] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isRotating, setIsRotating] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, lRes, mRes] = await Promise.allSettled([
        fetch('http://localhost:3001/status'),
        fetch('http://localhost:3001/logs'),
        fetch('http://localhost:3001/metrics'),
      ]);
      if (sRes.status === 'fulfilled') { const d = await sRes.value.json(); setIsHalted(d.status === 'HALTED'); }
      if (lRes.status === 'fulfilled') { const d = await lRes.value.json(); setLogs(d.logs ?? []); }
      if (mRes.status === 'fulfilled') setMetrics(await mRes.value.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const toggleHalt = async () => {
    setActionStatus(isHalted ? 'RESUMING...' : 'HALTING...');
    try {
      const res = await fetch('http://localhost:3001/admin/halt', { method: 'POST' });
      const data = await res.json();
      setIsHalted(data.halted);
      setActionStatus(data.halted ? 'PROTOCOL HALTED' : 'PROTOCOL RESUMED');
    } catch { setActionStatus('ERROR: GATEWAY_OFFLINE'); }
    setTimeout(() => setActionStatus(null), 3000);
  };

  const resetLogs = async () => {
    setActionStatus('FLUSHING AUDIT LOGS...');
    try {
      await fetch('http://localhost:3001/admin/reset-logs', { method: 'POST' });
      setLogs([]);
      setActionStatus('LOGS FLUSHED');
    } catch { setActionStatus('ERROR'); }
    setTimeout(() => setActionStatus(null), 2000);
  };

  const rotateKeys = async () => {
    setIsRotating(true);
    setActionStatus('ROTATING ACCESS KEYS...');
    try {
      const res = await fetch('http://localhost:3001/admin/rotate-keys', { method: 'POST' });
      const data = await res.json();
      setActionStatus(`KEY_ROTATED: ${data.newKeyId}`);
    } catch { setActionStatus('ROTATION FAILED'); }
    setTimeout(() => { setActionStatus(null); setIsRotating(false); }, 4000);
  };

  const runStressTest = async () => {
    setActionStatus('EXECUTING STRESS SIMULATION...');
    try {
      await fetch('http://localhost:3001/admin/stress-test', { method: 'POST' });
      setActionStatus('STRESS TEST COMPLETE');
    } catch { setActionStatus('ERROR'); }
    setTimeout(() => setActionStatus(null), 3000);
  };

  const filteredLogs = filterType === 'ALL' ? logs : logs.filter(l => l.type === filterType);

  const logColor = (type: string) => {
    if (type === 'WARN') return 'var(--danger)';
    if (type === 'AI') return 'var(--primary)';
    if (type === 'SUCCESS') return 'var(--success)';
    if (type === 'ADMIN') return 'var(--warning)';
    return 'var(--text-muted)';
  };

  const uptimeStr = metrics?.uptime ? `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m` : '--';

  return (
    <div className="animate-fade-in dashboard-container" style={{ padding: 0 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="section-title" style={{ color: isHalted ? 'var(--danger)' : 'var(--text)' }}>
            ADMIN // GATE v5.1
          </h2>
          <p className="section-subtitle">// EMERGENCY_PROTOCOL_GOVERNANCE · ROOT_ACCESS_v5.4 · VASP_OPERATOR</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {actionStatus && (
            <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', color: 'var(--warning)', padding: '10px 16px', border: '1px solid #222', animation: 'fadeIn 0.3s' }}>
              {actionStatus}
            </div>
          )}
          <button className="btn-primary" onClick={fetchAll}><RefreshCw size={11} style={{ display: 'inline', marginRight: 6 }} />SYNC</button>
          <button
            className={isHalted ? 'btn-success' : 'btn-danger'}
            onClick={toggleHalt}
          >
            {isHalted ? '▶ RESUME_PROTOCOL' : '⏹ EMERGENCY_HALT'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.5fr 1.3fr', gap: '16px' }}>
        {/* ── Left: System Status ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status card */}
          <div className={`glass-card${isHalted ? ' danger-border' : ' success-border'}`} data-coord="SYS">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Shield size={16} color={isHalted ? 'var(--danger)' : 'var(--success)'} />
              <span className="label-sm">SYSTEM_INTEGRITY</span>
            </div>
            <div style={{ padding: '20px', background: '#030303', border: `1px solid ${isHalted ? 'var(--danger)' : '#111'}`, position: 'relative', marginBottom: '16px' }}>
              <div className="data-grid-overlay" />
              <div className="label-xs" style={{ marginBottom: '8px', position: 'relative', zIndex: 1 }}>VASP_RUNTIME_STATE</div>
              <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-2px', color: isHalted ? 'var(--danger)' : 'var(--success)', position: 'relative', zIndex: 1 }}>
                {isHalted ? '⏹ HALTED' : '● OPERATIONAL'}
              </div>
            </div>
            <Pill label="mTLS SIX API" value="LOCKED" color="var(--success)" />
            <Pill label="FIREBLOCKS VAULT" value="ACTIVE" color="var(--success)" />
            <Pill label="PROTOCOL SAFETY" value="AES-256-GCM" color="var(--primary)" />
            <Pill label="COMPLIANCE HOOKS" value="REGISTERED" color="var(--success)" />
            <Pill label="GATEWAY UPTIME" value={uptimeStr} color="var(--text)" />
          </div>

          {/* Network slot */}
          <div className="glass-card clickable cyan-border" data-coord="NET">
            <div className="label-sm" style={{ marginBottom: '16px' }}>NETWORK_STATUS</div>
            <Pill label="NETWORK" value="solana-devnet" color="var(--primary)" />
            <Pill label="SLOT" value={metrics?.slot ?? '–'} color="var(--secondary)" />
            <Pill label="PROGRAM_ID" value="Heh9pGU..." color="var(--text-muted)" />
            <Pill label="TOTAL_LOGS" value={`${metrics?.totalLogs ?? logs.length}`} color="var(--text)" />
          </div>
        </div>

        {/* ── Middle: Actions ── */}
        <div className="glass-card" data-coord="ACT">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span className="label-sm">ROOT_ACTIONS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ActionButton
              label="ROTATE_ACCESS_KEYS" description="// Ed25519 · Fireblocks MPC"
              onClick={rotateKeys} color="var(--primary)" icon={Key} disabled={isRotating}
            />
            <ActionButton
              label="FLUSH_AUDIT_LOGS" description="// Clear stream buffer"
              onClick={resetLogs} color="var(--warning)" icon={RotateCcw}
            />
            <ActionButton
              label="RUN_STRESS_TEST" description="// XAU/USD 20% volatility sim"
              onClick={runStressTest} color="var(--accent)" icon={Zap}
            />
            <ActionButton
              label={isHalted ? 'RESUME_PROTOCOL' : 'EMERGENCY_HALT'} description="// Governance circuit-breaker"
              onClick={toggleHalt} color={isHalted ? 'var(--success)' : 'var(--danger)'} icon={Power}
            />
            <ActionButton
              label="EXPORT_ISO-20022" description="// Generate audit JSON report"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ logs, metrics, timestamp: new Date().toISOString() }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'antigravity_audit.json'; a.click();
              }}
              color="var(--secondary)" icon={BarChart2}
            />
          </div>

          {/* Metrics */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #111' }}>
            <div className="label-xs" style={{ marginBottom: '12px' }}>LIVE_TELEMETRY</div>
            <Pill label="RISK_SCORE" value={`${metrics?.riskScore ?? 14.2}`} color="var(--secondary)" />
            <Pill label="COMPLIANCE_RATE" value={`${metrics?.complianceRate ?? 99.7}%`} color="var(--success)" />
            <Pill label="VIOLATIONS_BLOCKED" value={`${metrics?.violationsBlocked ?? 3}`} color="var(--danger)" />
            <Pill label="SWEEPS_EXECUTED" value={`${metrics?.sweepsExecuted ?? 47}`} color="var(--primary)" />
          </div>
        </div>

        {/* ── Right: Full Audit Log ── */}
        <div className="glass-card" data-coord="LOG" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={16} color="var(--primary)" />
              <span className="label-sm">ROOT_AUDIT_STREAM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="status-dot active" />
              <span className="label-xs" style={{ color: 'var(--success)' }}>LIVE</span>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['ALL', 'WARN', 'AI', 'SUCCESS', 'ADMIN', 'ACTION'].map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                style={{
                  fontFamily: 'var(--terminal-font)', fontSize: '0.5rem', fontWeight: 900,
                  padding: '3px 8px', border: `1px solid ${filterType === f ? '#333' : '#181818'}`,
                  background: filterType === f ? '#181818' : 'transparent',
                  color: filterType === f ? logColor(f) : 'var(--text-dim)', cursor: 'pointer',
                  letterSpacing: '1px',
                }}
              >{f}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--terminal-font)', fontSize: '0.5rem', color: 'var(--text-dim)' }}>
              {filteredLogs.length} EVENTS
            </span>
          </div>

          <div ref={scrollRef} className="terminal-block" style={{ flex: 1, maxHeight: '520px', overflowY: 'auto' }}>
            <div className="data-grid-overlay" />
            {filteredLogs.length === 0 && (
              <div style={{ color: '#333', textAlign: 'center', marginTop: '80px', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px' }}>
                AWAITING_EVENTS...
              </div>
            )}
            {filteredLogs.map((log, i) => (
              <div
                key={`${log.id}-${i}`}
                className="terminal-line"
                style={{
                  borderLeft: `2px solid ${logColor(log.type)}`, paddingLeft: '12px',
                  cursor: 'pointer', transition: 'background 0.15s', position: 'relative', zIndex: 1,
                }}
                onClick={() => setSelectedLog(log)}
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
        </div>
      </div>

      {/* Log detail modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.75rem', fontWeight: 900, color: logColor(selectedLog.type), letterSpacing: '2px' }}>
                LOG_EVENT // {selectedLog.type}
              </span>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <Pill label="EVENT_ID" value={`0x${selectedLog.id.toString(16).toUpperCase()}`} color="var(--primary)" />
            <Pill label="TIMESTAMP" value={selectedLog.time} color="var(--text)" />
            <Pill label="TYPE" value={selectedLog.type} color={logColor(selectedLog.type)} />
            <div style={{ marginTop: '16px', padding: '16px', background: '#030303', border: '1px solid #111', fontFamily: 'var(--terminal-font)', fontSize: '0.7rem', color: 'var(--text)', lineHeight: 1.6 }}>
              {selectedLog.msg}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
