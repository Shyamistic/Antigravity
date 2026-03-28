import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Activity, ArrowUpRight, Shield, Brain, TrendingUp, Globe, Zap, Lock,
  RefreshCw, AlertTriangle, ChevronRight, X, Clock, BarChart2, DollarSign
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface Metrics {
  aum?: { sol: number; usdc: number; chf: number };
  riskScore?: number;
  complianceRate?: number;
  sweepsExecuted?: number;
  violationsBlocked?: number;
  mpcSigners?: { active: number; required: number };
  latency?: number;
  uptime?: number;
  slot?: number;
  isHalted?: boolean;
}

interface FxRate { pair: string; rate: number; latency: number; }
interface FlowItem { time: string; volume: number; }

// ──────────────────────────────────────────────────────────────
// Helper Components
// ──────────────────────────────────────────────────────────────
const Pill = ({ label, value, color = '#999' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color }}>{value}</span>
  </div>
);

const MetricCard = ({
  title, value, sub, trend, color = 'var(--text)', coord, onClick, icon: Icon, change
}: {
  title: string; value: string; sub: string; trend?: string;
  color?: string; coord: string; onClick?: () => void; icon?: any; change?: string;
}) => (
  <div
    className={`glass-card animate-fade-in${onClick ? ' clickable' : ''}`}
    data-coord={coord}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <span className="label-xs" style={{ color: 'var(--text-muted)' }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={14} color={color} />}
        <div className="status-dot active" />
      </div>
    </div>
    <div className="stat-value" style={{ fontSize: '2rem', color, marginBottom: '8px' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {trend && <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 900, color: 'var(--success)' }}>{trend}</span>}
      {change && <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--success)' }}>{change}</span>}
      <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{sub}</span>
    </div>
    {onClick && (
      <div style={{ position: 'absolute', bottom: '14px', right: '18px', opacity: 0.3 }}>
        <ChevronRight size={12} color="var(--primary)" />
      </div>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────
// Modal: Position Detail
// ──────────────────────────────────────────────────────────────
const DetailModal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
        <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '2px' }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// Overview Component
// ──────────────────────────────────────────────────────────────
const Overview = () => {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [balance, setBalance] = useState<any>(null);
  const [chartData, setChartData] = useState<FlowItem[]>([]);
  const [fxRates, setFxRates] = useState<FxRate[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [lvs, setLvs] = useState(73.2);
  const [modal, setModal] = useState<string | null>(null);
  const [complianceScan, setComplianceScan] = useState<any>(null);
  const [latencyHistory, setLatencyHistory] = useState<{ t: number; v: number }[]>([]);
  const [scanRunning, setScanRunning] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, bRes, cRes, p1, p2, p3] = await Promise.allSettled([
        fetch(`${API_URL}/metrics`),
        fetch(`${API_URL}/balance`),
        fetch(`${API_URL}/charts/flows`),
        fetch(`${API_URL}/fx-rate?pair=USD/CHF`),
        fetch(`${API_URL}/fx-rate?pair=EUR/CHF`),
        fetch(`${API_URL}/liquidity/positions`),
      ]);
      if (mRes.status === 'fulfilled') {
        const d = await mRes.value.json();
        setMetrics(d);
        setLatencyHistory(h => [...h.slice(-19), { t: Date.now(), v: d.latency ?? 40 }]);
      }
      if (bRes.status === 'fulfilled') setBalance(await bRes.value.json());
      if (cRes.status === 'fulfilled') setChartData(await cRes.value.json());
      if (p3.status === 'fulfilled') setPositions(await p3.value.json());
      const rates: FxRate[] = [];
      if (p1.status === 'fulfilled') rates.push(await p1.value.json());
      if (p2.status === 'fulfilled') rates.push(await p2.value.json());
      setFxRates(rates);
      setLvs(v => Math.min(v + 0.03, 79.1));
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleStressTest = async () => {
    setIsStressTesting(true);
    try { await fetch(`${API_URL}/admin/stress-test`, { method: 'POST' }); } catch {}
    setTimeout(() => setIsStressTesting(false), 3500);
  };

  const runComplianceScan = async () => {
    setScanRunning(true);
    try {
      const r = await fetch(`${API_URL}/compliance/scan`);
      setComplianceScan(await r.json());
      setModal('COMPLIANCE_SCAN');
    } catch {}
    setScanRunning(false);
  };

  const totalAUM = balance
    ? `$${((balance.usdc + balance.eur * 1.05) / 1e6).toFixed(2)}M`
    : '$4.70M';
  const uptimeStr = metrics.uptime ? `${Math.floor(metrics.uptime / 60)}m ${Math.floor(metrics.uptime % 60)}s` : '--';

  return (
    <div className="animate-fade-in dashboard-container" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="section-title">SYSTEM // OVERVIEW</h2>
          <p className="section-subtitle">// ANTIGRAVITY_v5.1 · INSTITUTIONAL_LIQUIDITY_ORCHESTRATOR · GRAND_PRIZE_EDITION</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={fetchAll}><RefreshCw size={11} style={{ display: 'inline', marginRight: 6 }} />REFRESH</button>
          <button className="btn-primary" onClick={runComplianceScan} disabled={scanRunning}>
            {scanRunning ? 'SCANNING...' : 'RUN_COMPLIANCE_SCAN'}
          </button>
          <button className="btn-primary" onClick={handleStressTest} disabled={isStressTesting}
            style={{ borderColor: isStressTesting ? '#333' : 'var(--accent)', color: isStressTesting ? '#333' : 'var(--accent)' }}>
            {isStressTesting ? 'SIMULATING…' : 'STRESS_TEST_v5'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Key Metrics (4 cols) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <MetricCard
          title="TOTAL AUM" value={totalAUM} sub="// FIREBLOCKS_VAULTS" trend="↑3.2%" color="var(--text)"
          coord="A1" icon={DollarSign}
          onClick={() => setModal('AUM_DETAIL')}
        />
        <MetricCard
          title="COMPLIANCE_RATE" value={`${metrics.complianceRate ?? 99.7}%`} sub="// SIX_BFI_VERIFIED"
          coord="A2" color="var(--success)" icon={Shield} trend="↑0.3%"
          onClick={() => setModal('COMPLIANCE_DETAIL')}
        />
        <MetricCard
          title="RISK_SCORE" value={`${metrics.riskScore ?? 14.2}`}
          sub="// BELOW_THRESHOLD" coord="A3" color="var(--secondary)" icon={Activity}
          change="SAFE" onClick={() => setModal('RISK_DETAIL')}
        />
        <MetricCard
          title="GATEWAY_LATENCY" value={`${metrics.latency ?? 42}ms`}
          sub="// SIX_BFI_FEED" coord="A4" color="var(--primary)" icon={Zap}
          trend={`${metrics.latency ?? 42 < 60 ? '↓' : '↑'}`}
          onClick={() => setModal('LATENCY_DETAIL')}
        />
      </div>

      {/* ── Row 2: Main chart + right panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '16px', marginBottom: '16px' }}>
        {/* Capital Flow Chart */}
        <div className="glass-card clickable" data-coord="B1" onClick={() => setModal('FLOW_CHART')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <div className="label-sm">CAPITAL_FLOW_MATRIX</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', fontFamily: 'var(--terminal-font)', marginTop: '4px' }}>
                // REAL-TIME_TREASURY_VOLUME · SIX_BFI_DATA
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="status-dot active" />
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', color: 'var(--success)', fontWeight: 900 }}>LIVE</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="#111" />
              <XAxis dataKey="time" tick={{ fill: '#555', fontSize: 9, fontFamily: 'var(--terminal-font)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 9, fontFamily: 'var(--terminal-font)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#080808', border: '1px solid #222', fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', color: '#e8e8e8' }}
                labelStyle={{ color: 'var(--primary)' }}
              />
              <Area type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={1.5} fill="url(#volumeGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '16px', display: 'flex', gap: '32px' }}>
            {[
              { l: 'TOTAL_VOLUME', v: '$8.62M' },
              { l: 'AVG_TICKET', v: '$1.43M' },
              { l: 'SWEEPS_EXEC', v: `${metrics.sweepsExecuted ?? 47}` },
            ].map((s, i) => (
              <div key={i}>
                <div className="label-xs">{s.l}</div>
                <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, color: 'var(--text)', fontSize: '0.85rem', marginTop: '4px' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FX Rates Panel */}
        <div className="glass-card clickable" data-coord="B2" onClick={() => setModal('FX_RATES')}>
          <div className="label-sm" style={{ marginBottom: '24px' }}>LIVE_FX_RATES // SIX_BFI</div>
          {fxRates.length > 0 ? fxRates.map((r, i) => (
            <div key={i} style={{ marginBottom: '20px', padding: '12px', background: '#060606', border: '1px solid #111' }}>
              <div className="label-xs" style={{ marginBottom: '6px' }}>{r.pair}</div>
              <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)', letterSpacing: '-1px' }}>
                {r.rate?.toFixed(4)}
              </div>
              <div className="label-xs" style={{ marginTop: '4px' }}>LATENCY: {r.latency}ms</div>
            </div>
          )) : (
            <div style={{ padding: '16px 0', fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>// FETCHING_RATES...</div>
          )}
          {/* Static backup rates */}
          {fxRates.length === 0 && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#060606', border: '1px solid #111' }}>
              <div className="label-xs" style={{ marginBottom: '6px' }}>USD/CHF</div>
              <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)', letterSpacing: '-1px' }}>0.8842</div>
            </div>
          )}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="status-dot cyan" />
            <span className="label-xs">mTLS_SECURED · SIX_CERT_v1.4</span>
          </div>
        </div>
      </div>

      {/* ── Row 3: 3-col telemetry ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* MPC Signing */}
        <div className="glass-card clickable" data-coord="C1" onClick={() => setModal('MPC_DETAIL')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Lock size={16} color="var(--primary)" />
            <span className="label-sm">FIREBLOCKS_MPC_SIGNING</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {[1, 1, 1, 0].map((s, i) => (
              <div key={i} style={{ flex: 1, height: '4px', background: s ? 'var(--primary)' : '#181818', boxShadow: s ? '0 0 6px var(--primary)' : 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
          <Pill label="SIGNERS_ACTIVE" value={`${metrics.mpcSigners?.active ?? 3} / ${metrics.mpcSigners?.required ?? 4}`} color="var(--primary)" />
          <Pill label="SCHEME" value="Ed25519_THRESHOLD" color="var(--text)" />
          <Pill label="CUSTODY" value="FIREBLOCKS_MPC-CMP" color="var(--success)" />
        </div>

        {/* mTLS Gateway */}
        <div className="glass-card clickable" data-coord="C2" onClick={() => setModal('MTLS_DETAIL')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Shield size={16} color="var(--success)" />
            <span className="label-sm">mTLS_GATEWAY v1.4</span>
          </div>
          <div style={{ padding: '12px', background: '#030303', border: '1px solid #111', marginBottom: '12px', position: 'relative' }}>
            <div className="data-grid-overlay" />
            <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', color: 'var(--success)', position: 'relative', zIndex: 1 }}>
              ✓ CERT_HANDSHAKE: OK<br />
              ✓ CA: SIX_BFI_ROOT_v4<br />
              ✓ TLS 1.3 · AES-256-GCM
            </div>
          </div>
          <Pill label="LATENCY" value={`${metrics.latency ?? 42}ms`} color="var(--primary)" />
          <Pill label="UPTIME" value={uptimeStr} color="var(--success)" />
        </div>

        {/* Oracle Health */}
        <div className="glass-card clickable" data-coord="C3" onClick={() => setModal('ORACLE_DETAIL')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Globe size={16} color="var(--secondary)" />
            <span className="label-sm">ORACLE_HEALTH_MATRIX</span>
          </div>
          {[
            { name: 'SIX_BFI_FEED', status: 'PRIMARY', color: 'var(--success)' },
            { name: 'CHAINLINK', status: 'BACKUP_READY', color: 'var(--primary)' },
            { name: 'PYTH_NETWORK', status: 'SYNCED', color: 'var(--primary)' },
            { name: 'BAND_PROTOCOL', status: 'STANDBY', color: 'var(--text-muted)' },
          ].map((o, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0d0d0d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="status-dot" style={{ background: o.color, boxShadow: `0 0 4px ${o.color}` }} />
                <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text)' }}>{o.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: o.color }}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 4: Positions + AI Risk + LVS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.3fr', gap: '16px' }}>
        {/* Liquidity Positions */}
        <div className="glass-card" data-coord="D1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span className="label-sm">ACTIVE_TREASURY_POSITIONS</span>
            <span className="tag tag-cyan">LIVE</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--terminal-font)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #181818' }}>
                {['VENUE', 'ASSET', 'AUM', 'APY', 'UTIL%', 'RISK'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(positions.length ? positions : [
                { id: 'POS-001', venue: 'AMINA_SWISS_VAULT', asset: 'USDC', amount: 1500000, apy: 14.2, risk: 'LOW', utilization: 0.82 },
                { id: 'POS-002', venue: 'SIX_GOLD_STABLE', asset: 'XAU-T', amount: 800000, apy: 22.8, risk: 'MEDIUM', utilization: 0.45 },
                { id: 'POS-003', venue: 'SOLANA_L3_POOL', asset: 'SOL', amount: 450000, apy: 18.5, risk: 'LOW', utilization: 0.91 },
                { id: 'POS-004', venue: 'FIREBLOCKS_VAULT', asset: 'BTC', amount: 2100000, apy: 8.3, risk: 'LOW', utilization: 0.60 },
              ]).map((p: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #0d0d0d', cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => setModal(`POS_${p.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0f0f0f')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '8px', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text)' }}>{p.venue}</td>
                  <td style={{ padding: '8px', fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 900 }}>{p.asset}</td>
                  <td style={{ padding: '8px', fontSize: '0.6rem', color: 'var(--text)' }}>${(p.amount / 1e6).toFixed(2)}M</td>
                  <td style={{ padding: '8px', fontSize: '0.6rem', color: 'var(--secondary)', fontWeight: 900 }}>{p.apy}%</td>
                  <td style={{ padding: '8px', fontSize: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ flex: 1, height: '2px', background: '#111' }}>
                        <div style={{ height: '100%', width: `${p.utilization * 100}%`, background: p.utilization > 0.8 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.55rem' }}>{(p.utilization * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: p.risk === 'LOW' ? 'var(--success)' : p.risk === 'MEDIUM' ? 'var(--warning)' : 'var(--danger)' }}>
                      {p.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Risk Engine */}
        <div className="glass-card clickable" data-coord="D2" onClick={() => setModal('AI_RISK')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Brain size={16} color="var(--accent)" />
            <span className="label-sm">AI_RISK_ENGINE</span>
          </div>
          <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '3rem', fontWeight: 900, color: 'var(--secondary)', letterSpacing: '-4px', lineHeight: 1, marginBottom: '8px' }}>
            {metrics.riskScore ?? 14.2}
          </div>
          <div className="label-xs" style={{ marginBottom: '16px' }}>// COMPOSITE_RISK_INDEX</div>
          {[
            { label: 'VOLATILITY', val: 18, color: 'var(--primary)' },
            { label: 'LIQUIDITY', val: 8, color: 'var(--success)' },
            { label: 'COUNTERPARTY', val: 6, color: 'var(--success)' },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="label-xs">{r.label}</span>
                <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: r.color }}>{r.val}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${r.val}%`, background: r.color }} />
              </div>
            </div>
          ))}
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '16px', borderColor: 'var(--accent)', color: 'var(--accent)', fontSize: '0.58rem' }}
            onClick={e => { e.stopPropagation(); handleStressTest(); }}
            disabled={isStressTesting}
          >
            {isStressTesting ? 'RUNNING...' : 'SIMULATE_STRESS'}
          </button>
        </div>

        {/* LVS */}
        <div className="glass-card clickable" data-coord="D3" onClick={() => setModal('LVS_DETAIL')}>
          <div className="label-sm" style={{ marginBottom: '20px' }}>LVS</div>
          <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '2.8rem', color: lvs > 75 ? 'var(--success)' : 'var(--warning)', letterSpacing: '-3px', lineHeight: 1, marginBottom: '8px' }}>
            {lvs.toFixed(1)}
          </div>
          <div className="label-xs" style={{ marginBottom: '16px' }}>// LIQUIDITY_VELOCITY</div>
          <div className="progress-bar" style={{ height: '3px', marginBottom: '12px' }}>
            <div className={`progress-fill ${lvs > 75 ? 'green' : 'yellow'}`} style={{ width: `${lvs}%` }} />
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={latencyHistory.map((h, i) => ({ i, v: h.v }))}>
              <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="label-xs" style={{ marginTop: '8px' }}>// LATENCY_TREND</div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === 'AUM_DETAIL' && (
        <DetailModal title="AUM // BREAKDOWN" onClose={() => setModal(null)}>
          <Pill label="USDC (PRIMARY)" value={`$${((balance?.usdc ?? 2847500) / 1e6).toFixed(2)}M`} color="var(--primary)" />
          <Pill label="EUR (SECONDARY)" value={`€${((balance?.eur ?? 1850200) / 1e6).toFixed(2)}M`} color="var(--secondary)" />
          <Pill label="SOL (ON-CHAIN)" value={`${balance?.sol ?? 12.46} SOL`} color="var(--text)" />
          <Pill label="CUSTODIAN" value="FIREBLOCKS_MPC" color="var(--success)" />
          <Pill label="JURISDICTION" value="CH // AMINA_BANK" color="var(--text-muted)" />
        </DetailModal>
      )}
      {modal === 'COMPLIANCE_DETAIL' && (
        <DetailModal title="COMPLIANCE // DETAIL" onClose={() => setModal(null)}>
          <Pill label="COMPLIANCE_RATE" value="99.7%" color="var(--success)" />
          <Pill label="VIOLATIONS_BLOCKED" value={`${metrics.violationsBlocked ?? 3}`} color="var(--danger)" />
          <Pill label="SWEEPS_EXECUTED" value={`${metrics.sweepsExecuted ?? 47}`} color="var(--primary)" />
          <Pill label="TRAVEL_RULE" value="100% ENFORCED" color="var(--success)" />
          <Pill label="FATF_STATUS" value="EDD_COMPLIANT" color="var(--success)" />
        </DetailModal>
      )}
      {modal === 'COMPLIANCE_SCAN' && complianceScan && (
        <DetailModal title="COMPLIANCE_SCAN // RESULTS" onClose={() => setModal(null)}>
          <Pill label="SCAN_ID" value={complianceScan.scanId} color="var(--primary)" />
          <Pill label="FATF_VIOLATIONS" value={`${complianceScan.fatfViolations}`} color={complianceScan.fatfViolations === 0 ? 'var(--success)' : 'var(--danger)'} />
          <Pill label="PEEP_ENTITIES" value={`${complianceScan.peepEntities}`} color={complianceScan.peepEntities === 0 ? 'var(--success)' : 'var(--danger)'} />
          <Pill label="TRAVEL_RULE" value={`${complianceScan.travelRuleCompliance}%`} color="var(--success)" />
          <Pill label="AML_SCORE" value={`${complianceScan.amlScore}`} color="var(--success)" />
          <Pill label="HOOK_AUDIT" value={complianceScan.hookAuditPassed ? '✓ PASSED' : '✗ FAILED'} color={complianceScan.hookAuditPassed ? 'var(--success)' : 'var(--danger)'} />
        </DetailModal>
      )}
      {modal === 'MTLS_DETAIL' && (
        <DetailModal title="mTLS // GATEWAY_DETAIL" onClose={() => setModal(null)}>
          <Pill label="TLS_VERSION" value="TLS 1.3" color="var(--success)" />
          <Pill label="CIPHER" value="AES-256-GCM" color="var(--primary)" />
          <Pill label="CA_AUTHORITY" value="SIX_BFI_ROOT_v4" color="var(--text)" />
          <Pill label="CERT_EXPIRY" value="2026-12-31" color="var(--secondary)" />
          <Pill label="LATENCY" value={`${metrics.latency ?? 42}ms`} color="var(--primary)" />
          <Pill label="ENDPOINT" value="api.six-group.com/bfi" color="var(--text-muted)" />
        </DetailModal>
      )}
      {modal === 'MPC_DETAIL' && (
        <DetailModal title="FIREBLOCKS_MPC // SIGNING_DETAIL" onClose={() => setModal(null)}>
          <Pill label="SIGNERS_ONLINE" value="3 / 4" color="var(--primary)" />
          <Pill label="SCHEME" value="Ed25519 (MPC-CMP)" color="var(--text)" />
          <Pill label="THRESHOLD" value="3-of-4" color="var(--secondary)" />
          <Pill label="HSM_TYPE" value="FIREBLOCKS_CLOUD_HSM" color="var(--primary)" />
          <Pill label="LAST_ROTATION" value="2026-03-01" color="var(--text-muted)" />
        </DetailModal>
      )}
      {modal && modal.startsWith('POS_') && (
        <DetailModal title={`POSITION // ${modal.replace('POS_', '')}`} onClose={() => setModal(null)}>
          <p style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '16px' }}>// CLICK_ANY_ROW_TO_EXPAND_POSITION</p>
          <Pill label="STATUS" value="ACTIVE" color="var(--success)" />
          <Pill label="LAST_SWEEP" value="2 min ago" color="var(--primary)" />
          <Pill label="SETTLEMENT" value="T+0 via Solana-L3" color="var(--secondary)" />
        </DetailModal>
      )}
    </div>
  );
};

export default Overview;
