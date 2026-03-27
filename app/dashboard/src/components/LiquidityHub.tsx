import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lock, Plus, Eye, EyeOff } from 'lucide-react';

const data = [
  { name: 'Day 1', l1: 5.1, l2: 10.2, l3: 4.5 },
  { name: 'Day 5', l1: 5.2, l2: 12.4, l3: 4.6 },
  { name: 'Day 10', l1: 5.1, l2: 18.2, l3: 4.8 },
  { name: 'Day 15', l1: 5.3, l2: 14.1, l3: 4.7 },
  { name: 'Day 20', l1: 5.2, l2: 22.5, l3: 4.9 },
  { name: 'Day 25', l1: 5.4, l2: 19.8, l3: 4.8 },
  { name: 'Day 30', l1: 5.2, l2: 11.5, l3: 4.7 },
];

const StratumCard = ({ label, yieldPct, strat, color }: { label: string; yieldPct: number; strat: string; color: string }) => (
  <div className="glass-card" style={{ borderLeft: `4px solid ${color}`, background: 'rgba(255,255,255,0.02)' }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{strat}</div>
    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>{label}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{yieldPct}%</span>
      <span className="tag" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>Direct CPI</span>
    </div>
  </div>
);

const LiquidityHub = () => {
  const [sweeping, setSweeping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [vaults, setVaults] = useState([
    { id: 1, name: 'Institutional Vault #1', balance: 1250000, status: 'active', type: 'yield', frozen: false },
    { id: 2, name: 'Treasury Reserve', balance: 850000, status: 'active', type: 'reserve', frozen: false },
    { id: 3, name: 'Compliance Hold', balance: 320000, status: 'frozen', type: 'compliance', frozen: true },
  ]);
  const [showVaultDetails, setShowVaultDetails] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      fetch('http://localhost:3002/config')
        .then(res => res.json())
        .then(d => setPaused(d.enginePaused))
        .catch(() => {});
    };
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSweep = async () => {
    setSweeping(true);
    try {
      const response = await fetch('http://localhost:3002/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1500000, direction: 'SWEEP' }),
      });
      const d = await response.json();
      if (d.error) throw new Error(d.error);
      setLastTx(d.payment_id);
    } catch (err: any) {
      alert(`Sweep failed: ${err.message}`);
    } finally {
      setSweeping(false);
    }
  };

  const createVault = () => {
    setVaults(prev => [
      ...prev,
      { id: prev.length + 1, name: `New Vault #${prev.length + 1}`, balance: 0, status: 'pending', type: 'yield', frozen: false },
    ]);
  };

  const toggleVaultFreeze = (vaultId: number) => {
    setVaults(prev =>
      prev.map(v => (v.id === vaultId ? { ...v, frozen: !v.frozen, status: v.frozen ? 'active' : 'frozen' } : v))
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>Liquidity Orchestration</h2>
        <p style={{ color: 'var(--text-dim)' }}>Automated capital velocity across the L1/L2/L3 Stratum.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StratumCard strat="L1 - BASE" label="Tokenized T-Bills" yieldPct={5.2} color="#3b82f6" />
        <StratumCard strat="L2 - ACTIVE" label="Delta-Neutral Arb" yieldPct={11.5} color="#a855f7" />
        <StratumCard strat="L3 - ALPHA" label="Commodity Spread" yieldPct={4.7} color="#ec4899" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Yield Performance (30D)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} style={{ cursor: 'crosshair' }}>
                <defs>
                  <linearGradient id="colorL1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorL2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorL3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="l2" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorL2)" stackId="1" />
                <Area type="monotone" dataKey="l1" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorL1)" stackId="1" />
                <Area type="monotone" dataKey="l3" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorL3)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', justifyContent: 'center' }}>
            {[{ c: '#3b82f6', l: 'L1 Base' }, { c: '#a855f7', l: 'L2 Arb' }, { c: '#ec4899', l: 'L3 Alpha' }].map(item => (
              <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <div style={{ width: '12px', height: '12px', background: item.c, borderRadius: '2px' }} /> {item.l}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>Vault Management</h3>
            <button className="btn-primary" onClick={createVault} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <Plus size={16} /> Create Vault
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vaults.map(vault => (
              <div key={vault.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Lock size={18} color={vault.frozen ? '#ef4444' : 'var(--primary)'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{vault.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{vault.type} • {vault.status}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${(vault.balance / 1000).toFixed(0)}K</div>
                    <button
                      onClick={() => setShowVaultDetails(showVaultDetails === vault.id ? null : vault.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                    >
                      {showVaultDetails === vault.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                {showVaultDetails === vault.id && (
                  <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Actions:</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }} disabled={vault.frozen}>Deposit</button>
                        <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }} disabled={vault.frozen}>Transfer</button>
                        <button
                          onClick={() => toggleVaultFreeze(vault.id)}
                          style={{ fontSize: '0.7rem', padding: '4px 8px', background: vault.frozen ? '#10b981' : '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}
                        >
                          {vault.frozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '24px' }}>Orchestrator</h3>
        <button
          className="btn-primary"
          style={{ width: '100%', marginBottom: '16px', background: paused ? 'var(--border)' : 'var(--primary)' }}
          onClick={handleSweep}
          disabled={sweeping || paused}
        >
          {sweeping ? 'Orchestrating...' : 'Trigger Manual Sweep'}
        </button>
        <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Last Payment ID</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>{lastTx || 'Waiting...'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="tag" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>JIT-ENABLED</span>
        </div>
      </div>
    </div>
  );
};

export default LiquidityHub;
