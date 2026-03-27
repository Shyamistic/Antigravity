import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const NliCalculator = () => {
  const [nostroBalance, setNostroBalance] = useState(500000000); // $500M
  const [currentYield, setCurrentYield] = useState(0.3); // 0.3%
  const [agYield, setAgYield] = useState(8.0); // 8% APY
  const [saasCost, setSaasCost] = useState(500000); // $500k

  const computeNLI = () => {
    const freedLiquidity = nostroBalance * 0.70; // Assume 70% release
    const legacyEarnings = (freedLiquidity * (currentYield / 100));
    const agEarnings = (freedLiquidity * (agYield / 100));
    const netAlpha = agEarnings - legacyEarnings - saasCost;
    const roi = (netAlpha / saasCost).toFixed(1);
    
    return {
      freed: freedLiquidity,
      legacy: legacyEarnings,
      ag: agEarnings,
      alpha: netAlpha,
      roi: roi
    };
  };

  const res = computeNLI();
  const chartData = [
    { name: 'Legacy Nostro', value: res.legacy, color: '#94a3b8' },
    { name: 'Antigravity Yield', value: res.ag, color: '#10b981' },
    { name: 'Net Alpha Unlock', value: res.alpha, color: '#6366f1' },
  ];

  const formatCurrency = (val: number) => `$${(val / 1e6).toFixed(2)}M`;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>Nostro Liberation Index (NLI)</h2>
        <p style={{ color: 'var(--text-dim)' }}>Quantifying the 52x ROI of migrating from legacy pre-funded accounts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Simulation Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Current Nostro Balance ($)</label>
              <input 
                type="number" 
                value={nostroBalance} 
                onChange={(e) => setNostroBalance(Number(e.target.value))}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }}
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Legacy Yield (%)</label>
              <input 
                type="number" step="0.1"
                value={currentYield} 
                onChange={(e) => setCurrentYield(Number(e.target.value))}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white' }}
              />
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', marginTop: '40px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-dim)" fontSize={12} width={100} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                   formatter={(val: number) => formatCurrency(val)}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ border: '2px solid #10b981', boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '8px' }}>ANNUAL PROFIT UNLOCK</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(res.alpha)}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SUBSCRIPTION COST</div>
                <div style={{ fontWeight: 700 }}>$500k</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>NET ROI</div>
                <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.4rem' }}>{res.roi}x</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '12px' }}>Operational Impact</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>By liberating {formatCurrency(res.freed)} in pre-funded capital, the institution increases its <strong>Liquidity Velocity Score (LVS)</strong> by 3.6x while maintaining protocol-level compliance.</p>
          </div>
          
          <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            "A mid-tier bank makes {res.roi}x their Antigravity subscription cost annually."
          </div>
        </div>
      </div>
    </div>
  );
};

export default NliCalculator;
