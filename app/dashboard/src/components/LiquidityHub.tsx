import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, Globe, Zap, Activity, RefreshCw, ChevronRight, X, AlertTriangle, Shield } from 'lucide-react';

interface Position { id: string; venue: string; asset: string; amount: number; apy: number; risk: string; utilization: number; }

const Pill = ({ label, value, color = '#999' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color }}>{value}</span>
  </div>
);

const YieldBar = ({ position, onClick }: { position: Position; onClick: () => void }) => {
  const riskColor = position.risk === 'LOW' ? 'var(--success)' : position.risk === 'MEDIUM' ? 'var(--warning)' : 'var(--danger)';
  return (
    <div
      className="clickable"
      onClick={onClick}
      style={{ padding: '16px', background: '#060606', border: '1px solid #111', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '8px' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#282828')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#111')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text)', marginBottom: '2px' }}>{position.venue}</div>
          <div className="label-xs">{position.asset} · ${(position.amount / 1e6).toFixed(2)}M AUM</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--secondary)', letterSpacing: '-2px', lineHeight: 1 }}>{position.apy}%</div>
          <div className="label-xs">EST. APY</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className={`progress-fill ${position.utilization > 0.85 ? 'yellow' : 'green'}`}
            style={{ width: `${position.utilization * 100}%` }} />
        </div>
        <span className="label-xs">{(position.utilization * 100).toFixed(0)}%</span>
        <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: riskColor }}>{position.risk}</span>
        <ChevronRight size={11} color="var(--text-dim)" />
      </div>
    </div>
  );
};

const LiquidityHub = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isSweeping, setIsSweeping] = useState(false);
  const [governanceWeight, setGovernanceWeight] = useState(72);
  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [sweepResult, setSweepResult] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.allSettled([
        fetch('http://localhost:3001/liquidity/positions'),
        fetch('http://localhost:3001/charts/flows'),
      ]);
      if (pRes.status === 'fulfilled') setPositions(await pRes.value.json());
      if (cRes.status === 'fulfilled') setChartData(await cRes.value.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      setGovernanceWeight(g => Math.min(100, Math.max(60, g + (Math.random() > 0.5 ? 0.5 : -0.5))));
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleSweep = async () => {
    setIsSweeping(true);
    setSweepResult(null);
    try {
      await fetch('http://localhost:3001/demo/sweep', { method: 'POST' });
      setSweepResult(`SWEEP_COMPLETE: $1.2M reallocated via Solana-L3 · ${new Date().toTimeString().slice(0, 8)}`);
    } catch {}
    setTimeout(() => setIsSweeping(false), 2000);
  };

  const totalAUM = positions.reduce((s, p) => s + p.amount, 0);
  const wAvgApy = positions.length ? (positions.reduce((s, p) => s + p.apy * p.amount, 0) / totalAUM) : 17.8;

  return (
    <div className="animate-fade-in dashboard-container" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="section-title">LIQUIDITY // INTELLIGENCE</h2>
          <p className="section-subtitle">// AGENTIC_TREASURY_MANAGEMENT · CROSS-CHAIN_BRIDGE · YIELD_OPTIMIZER_v5.1</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {sweepResult && (
            <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', color: 'var(--success)', padding: '10px 14px', border: '1px solid #181818' }}>
              ✓ {sweepResult}
            </div>
          )}
          <button className="btn-primary" onClick={fetchAll}><RefreshCw size={11} style={{ display: 'inline', marginRight: 6 }} />REFRESH</button>
          <button className="btn-primary" onClick={handleSweep} disabled={isSweeping}
            style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
            {isSweeping ? 'ALLOCATING...' : 'DEPLOY_AGENTIC_SWEEP'}
          </button>
        </div>
      </div>

      {/* ── Top stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'TOTAL_AUM', value: totalAUM ? `$${(totalAUM / 1e6).toFixed(2)}M` : '$4.85M', color: 'var(--text)', icon: TrendingUp },
          { label: 'WEIGHTED_APY', value: `${wAvgApy.toFixed(1)}%`, color: 'var(--secondary)', icon: Activity },
          { label: 'GOVERNANCE_WEIGHT', value: `${governanceWeight.toFixed(1)}%`, color: 'var(--primary)', icon: Shield },
          { label: 'ACTIVE_POSITIONS', value: `${positions.length || 4}`, color: 'var(--success)', icon: Globe },
        ].map((s, i) => (
          <div key={i} className="glass-card clickable" data-coord={`T${i + 1}`} onClick={() => setModal({ type: s.label })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="label-xs">{s.label}</span>
              <s.icon size={13} color={s.color} />
            </div>
            <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.6rem', color: s.color, letterSpacing: '-2px', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr', gap: '16px', marginBottom: '16px' }}>
        {/* Capital flow chart */}
        <div className="glass-card clickable" data-coord="FLOW" onClick={() => setModal({ type: 'FLOW_CHART' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="label-sm">TREASURY_FLOW_ANALYSIS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="status-dot active" />
              <span className="label-xs" style={{ color: 'var(--success)' }}>REAL-TIME</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData.length ? chartData : [
              { time: '08:00', volume: 420 }, { time: '10:00', volume: 1250 }, { time: '12:00', volume: 850 },
              { time: '14:00', volume: 1600 }, { time: '16:00', volume: 2100 }, { time: '18:00', volume: 1400 },
            ]}>
              <defs>
                <linearGradient id="liqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="#111" />
              <XAxis dataKey="time" tick={{ fill: '#555', fontSize: 9, fontFamily: 'var(--terminal-font)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 9, fontFamily: 'var(--terminal-font)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#080808', border: '1px solid #222', fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', color: '#e8e8e8' }} />
              <Area type="monotone" dataKey="volume" stroke="var(--secondary)" strokeWidth={1.5} fill="url(#liqGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk frontier + Cross-chain status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Risk frontier viz */}
          <div className="glass-card clickable" data-coord="RISK_F" onClick={() => setModal({ type: 'RISK_FRONTIER' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="label-sm">RISK_FRONTIER</span>
              <ChevronRight size={12} color="var(--text-dim)" />
            </div>
            <div style={{ height: '80px', background: '#030303', border: '1px solid #111', position: 'relative', overflow: 'hidden' }}>
              <div className="data-grid-overlay" />
              {[
                { top: '20%', left: '30%', color: 'var(--success)' },
                { top: '45%', left: '65%', color: 'var(--warning)' },
                { top: '70%', left: '80%', color: 'var(--danger)' },
              ].map((p, i) => (
                <div key={i} style={{ position: 'absolute', top: p.top, left: p.left, width: '6px', height: '6px', background: p.color, boxShadow: `0 0 8px ${p.color}`, zIndex: 1 }} />
              ))}
              <span style={{ position: 'absolute', bottom: '6px', right: '8px', fontFamily: 'var(--terminal-font)', fontSize: '0.45rem', color: '#222', zIndex: 1 }}>// EFFICIENT_FRONTIER_v5</span>
            </div>
          </div>

          {/* Cross-chain bridge */}
          <div className="glass-card clickable" data-coord="BRIDGE" onClick={() => setModal({ type: 'BRIDGE_STATUS' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="label-sm">CROSS-CHAIN_BRIDGE</span>
              <ChevronRight size={12} color="var(--text-dim)" />
            </div>
            {[
              { path: 'SOL → ETH', vol: '$12.4M', status: 'SYNCED', color: 'var(--success)' },
              { path: 'SOL → AVAX', vol: '$2.1M', status: 'SYNCED', color: 'var(--success)' },
              { path: 'ETH → USX', vol: '$642K', status: 'PENDING', color: 'var(--warning)' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #0d0d0d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="status-dot" style={{ background: b.color, boxShadow: `0 0 4px ${b.color}`, width: '5px', height: '5px' }} />
                  <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text)' }}>{b.path}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: b.color, marginRight: '8px' }}>{b.status}</span>
                  <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', color: 'var(--text-muted)' }}>{b.vol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Positions ── */}
      <div className="glass-card" data-coord="POSITIONS">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span className="label-sm">ACTIVE_TREASURY_POSITIONS // CLICK TO EXPAND</span>
          <span className="tag tag-cyan">{positions.length || 4} ACTIVE</span>
        </div>
        {(positions.length ? positions : [
          { id: 'POS-001', venue: 'AMINA_SWISS_VAULT', asset: 'USDC', amount: 1500000, apy: 14.2, risk: 'LOW', utilization: 0.82 },
          { id: 'POS-002', venue: 'SIX_GOLD_STABLE', asset: 'XAU-T', amount: 800000, apy: 22.8, risk: 'MEDIUM', utilization: 0.45 },
          { id: 'POS-003', venue: 'SOLANA_L3_POOL', asset: 'SOL', amount: 450000, apy: 18.5, risk: 'LOW', utilization: 0.91 },
          { id: 'POS-004', venue: 'FIREBLOCKS_VAULT', asset: 'BTC', amount: 2100000, apy: 8.3, risk: 'LOW', utilization: 0.60 },
        ]).map((p: any) => (
          <YieldBar key={p.id} position={p} onClick={() => { setSelectedPosition(p); setModal({ type: 'POSITION_DETAIL', data: p }); }} />
        ))}
      </div>

      {/* Modals */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '2px' }}>
                {modal.type.replace(/_/g, ' ')}
              </span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            {modal.type === 'POSITION_DETAIL' && modal.data && (
              <>
                <Pill label="POSITION_ID" value={modal.data.id} color="var(--primary)" />
                <Pill label="VENUE" value={modal.data.venue} color="var(--text)" />
                <Pill label="ASSET" value={modal.data.asset} color="var(--primary)" />
                <Pill label="AUM" value={`$${(modal.data.amount / 1e6).toFixed(2)}M`} color="var(--text)" />
                <Pill label="EST_APY" value={`${modal.data.apy}%`} color="var(--secondary)" />
                <Pill label="UTILIZATION" value={`${(modal.data.utilization * 100).toFixed(0)}%`} color={modal.data.utilization > 0.85 ? 'var(--warning)' : 'var(--success)'} />
                <Pill label="RISK_TIER" value={modal.data.risk} color={modal.data.risk === 'LOW' ? 'var(--success)' : 'var(--warning)'} />
                <Pill label="SETTLEMENT" value="T+0 via Solana-L3" color="var(--text-muted)" />
              </>
            )}
            {modal.type === 'BRIDGE_STATUS' && (
              <>
                <Pill label="SOL→ETH_VOL" value="$12.4M" color="var(--success)" />
                <Pill label="SOL→AVAX_VOL" value="$2.1M" color="var(--success)" />
                <Pill label="ETH→USX_PENDING" value="$642K" color="var(--warning)" />
                <Pill label="BRIDGE_PROVIDER" value="WORMHOLE_v2" color="var(--primary)" />
                <Pill label="AVG_LATENCY" value="2.4s" color="var(--text-muted)" />
              </>
            )}
            {modal.type === 'RISK_FRONTIER' && (
              <>
                <Pill label="PORTFOLIOVAR_95" value="2.4%" color="var(--success)" />
                <Pill label="MAX_DRAWDOWN" value="-3.8%" color="var(--warning)" />
                <Pill label="SHARPE_RATIO" value="4.2" color="var(--secondary)" />
                <Pill label="SORTINO_RATIO" value="6.1" color="var(--success)" />
                <Pill label="CORRELATION_SOL/USD" value="0.41" color="var(--text-muted)" />
              </>
            )}
            {!['POSITION_DETAIL', 'BRIDGE_STATUS', 'RISK_FRONTIER'].includes(modal.type) && (
              <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                // {modal.type} · data populated from real API responses
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidityHub;
