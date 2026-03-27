import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Info, ArrowUpRight, Globe, Layers, X, Shield, AlertTriangle, CheckCircle, Activity, Lock, Users, Brain, TrendingUp } from 'lucide-react';

const sparkData = [
  { v: 21 }, { v: 22 }, { v: 21.5 }, { v: 23 }, { v: 24.2 }, { v: 24.9 }, { v: 25.1 }
];

const Stat = ({ title, value, sub, trend, loading, highlight }: { title: string, value: string, sub: string, trend: string, loading?: boolean, highlight?: boolean }) => (
  <div className={`glass-card animate-fade-in ${highlight ? 'highlight-border' : ''}`} style={highlight ? { border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)' } : {}}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{title}</span>
      <span className="tag">{loading ? 'Syncing...' : 'Live'}</span>
    </div>
    <div className="stat-value" style={highlight ? { color: 'var(--primary)' } : {}}>{loading ? '---' : value}</div>
    <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
      <span className="trend-up">{trend}</span>
      <span style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>{sub}</span>
    </div>
  </div>
);

const LvsGauge = ({ score, onInfo }: { score: number, onInfo: () => void }) => {
  const color = score > 75 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="glass-card" style={{ textAlign: 'center', position: 'relative' }}>
        <button 
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }} 
            onClick={onInfo}
            title="View LVS Formula Breakdown"
        >
            <Info size={16} color="var(--text-dim)" />
        </button>
      <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-dim)' }}>Liquidity Velocity Score</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color }}>{score}</div>
        <div style={{ height: '40px', width: '60px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div style={{ height: '8px', width: '100%', background: 'var(--glass)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, transition: 'width 1s ease-in-out' }}></div>
      </div>
      <p style={{ fontSize: '0.8rem', marginTop: '12px', color: 'var(--text-dim)' }}>
        {score > 75 ? 'Optimal Capital Efficiency' : 'Idle Liquidity Detected'}
      </p>
    </div>
  );
};

const Overview = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lvs, setLvs] = useState(25.2);
  const [goldPrice, setGoldPrice] = useState(2185.06);
  const [showExplainer, setShowExplainer] = useState(false);
  const [vaultMetrics, setVaultMetrics] = useState({ active: 12, totalAssets: 2847500, frozen: 2 });
  const [multisigStatus, setMultisigStatus] = useState({ pending: 3, active: 8, executed: 45 });
  const [amlAlerts, setAmlAlerts] = useState([
    { id: 1, level: 'HIGH', message: 'Unusual pattern detected in EUR corridor', time: '5m ago', risk: 0.87 },
    { id: 2, level: 'MEDIUM', message: 'AI flagged potential sanctions exposure', time: '12m ago', risk: 0.64 }
  ]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('http://localhost:3002/balance');
        const data = await response.json();
        setBalance(data.sol);
        // Slowly optimize LVS
        setLvs(lvs => Math.min(lvs + 0.1, 78.2));
        setGoldPrice(p => p + (Math.random() - 0.5) * 1);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate real-time updates for institutional features
  useEffect(() => {
    const interval = setInterval(() => {
      setVaultMetrics(prev => ({
        active: Math.max(0, prev.active + Math.floor(Math.random() * 3) - 1),
        totalAssets: Math.max(0, prev.totalAssets + Math.floor(Math.random() * 50000) - 25000),
        frozen: Math.max(0, prev.frozen + Math.floor(Math.random() * 2) - 1)
      }));
      setMultisigStatus(prev => ({
        pending: Math.max(0, prev.pending + Math.floor(Math.random() * 2) - 1),
        active: Math.max(0, prev.active + Math.floor(Math.random() * 2) - 1),
        executed: prev.executed + Math.floor(Math.random() * 3)
      }));
      // Update AML alerts occasionally
      if (Math.random() < 0.3) {
        setAmlAlerts(prev => {
          const newAlert = {
            id: Date.now(),
            level: Math.random() > 0.7 ? 'HIGH' : 'MEDIUM',
            message: Math.random() > 0.5 ? 'AI detected anomalous transaction pattern' : 'Risk score elevated for jurisdiction',
            time: 'just now',
            risk: Math.random() * 0.5 + 0.5
          };
          return [newAlert, ...prev.slice(0, 2)];
        });
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {showExplainer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <div className="glass-card" style={{ maxWidth: '500px', border: '1px solid var(--primary)', position: 'relative' }}>
                <button 
                    onClick={() => setShowExplainer(false)}
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                >
                    <X size={20} />
                </button>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>LVS Formula Breakdown</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
                    Liquidity Velocity Score (LVS) is Antigravity's proprietary on-chain primitive for measuring institutional capital efficiency.
                </p>
                <div style={{ background: 'var(--glass)', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '1rem', marginBottom: '20px', textAlign: 'center' }}>
                    LVS = 100 × (Y_act / Y_opt) × C_f × (1 - S_p)
                </div>
                <ul style={{ fontSize: '0.85rem', color: 'var(--text-dim)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Y_act / Y_opt</strong>: Yield Capture vs. Benchmark</li>
                    <li><strong>C_f</strong>: Compliance Factor (IVMS 101 success rate)</li>
                    <li><strong>S_p</strong>: Settlement Float Penalty</li>
                </ul>
            </div>
        </div>
      )}

      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1.5px' }}>
            Executive Dashboard
          </h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: 'var(--glass)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <Globe size={14} color="#f59e0b" />
                <span style={{ color: 'var(--text-dim)' }}>SIX BFI:</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>XAU/USD ${goldPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: 'var(--glass)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <Layers size={14} color="var(--primary)" />
                <span style={{ color: 'var(--text-dim)' }}>STRATUM L3:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>4.7% SPREAD</span>
            </div>
          </div>
        </div>
        <div className="tag" style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 0 }}>
          AMINA BANK PILOT READY
        </div>
      </div>

      {/* Institutional Features Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Lock size={20} color="var(--primary)" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Vault Lifecycle Management</h4>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Active Vaults</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{vaultMetrics.active}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Total Vaulted Assets</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>${(vaultMetrics.totalAssets / 1000000).toFixed(1)}M</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Frozen Vaults</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: vaultMetrics.frozen > 0 ? '#ef4444' : '#10b981' }}>{vaultMetrics.frozen}</span>
          </div>
        </div>

        <div className="glass-card" style={{ border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Users size={20} color="#a855f7" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Multisig Governance</h4>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Pending Approvals</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: multisigStatus.pending > 0 ? '#f59e0b' : '#10b981' }}>{multisigStatus.pending}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Active Wallets</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{multisigStatus.active}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Executed This Month</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>{multisigStatus.executed}</span>
          </div>
        </div>

        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Brain size={20} color="#ef4444" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI AML Agent</h4>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '8px' }}>Active Risk Monitoring</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#10b981" />
              <span style={{ fontSize: '0.9rem', color: '#10b981' }}>Pattern Recognition Active</span>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Latest Alert: {amlAlerts[0]?.message || 'No active alerts'}
          </div>
        </div>
      </div>

      {/* AI AML Alerts Section */}
      {amlAlerts.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '40px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI Risk Alerts</h4>
            <span className="tag" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              {amlAlerts.filter(a => a.level === 'HIGH').length} High Priority
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {amlAlerts.slice(0, 2).map((alert) => (
              <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="tag" style={{ 
                      background: alert.level === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: alert.level === 'HIGH' ? '#ef4444' : '#f59e0b',
                      fontSize: '0.7rem'
                    }}>
                      {alert.level}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{alert.message}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444' }}>
                    {(alert.risk * 100).toFixed(0)}% Risk
                  </div>
                  <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px', marginTop: '4px' }}>
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <Stat title="INSTITUTIONAL BALANCE" value={balance !== null ? `${balance.toFixed(4)} SOL` : '---'} sub="Devnet Main" trend="Live" loading={loading} highlight />
        <Stat title="ACTIVE YIELD" value="21.42%" sub="delta-neutral" trend="+0.8%" />
        <Stat title="SETTLEMENT VOL" value="$842.1M" sub="monthly target" trend="+12%" />
        <Stat title="COMPLIANCE SCORE" value="99.8" sub="T+0 Finality" trend="Stable" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Real-time Capital Flows</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { type: 'VAULT_DEPOSIT', amount: '$2.1M', target: 'Institutional Vault #7', time: '1m ago', status: 'Confirmed', icon: Lock },
              { type: 'MULTISIG_EXEC', amount: '$850K', target: 'Treasury Transfer', time: '3m ago', status: 'Executed', icon: Users },
              { type: 'SWEEP', amount: '$1.5M', target: 'YieldVault (eUSX)', time: '5m ago', status: 'Confirmed', icon: TrendingUp },
              { type: 'JIT-SETTLE', amount: '$5.2M', target: 'B2B Corridor (SG)', time: '8m ago', status: 'Verified', icon: Activity },
              { type: 'COMPLIANCE', amount: 'N/A', target: 'Transfer Hook', time: '12m ago', status: 'Passed', icon: Shield },
              { type: 'AI_ANALYSIS', amount: 'N/A', target: 'Risk Assessment', time: '15m ago', status: 'Cleared', icon: Brain },
            ].map((op, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <op.icon size={16} color={
                    op.type === 'VAULT_DEPOSIT' ? 'var(--primary)' :
                    op.type === 'MULTISIG_EXEC' ? '#a855f7' :
                    op.type === 'AI_ANALYSIS' ? '#ef4444' :
                    '#10b981'
                  } />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{op.type.replace('_', ' ')} → {op.target}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{op.time}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{op.amount}</div>
                  <div style={{ color: '#10b981', fontSize: '0.8rem' }}>{op.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <LvsGauge score={Number(lvs.toFixed(1))} onInfo={() => setShowExplainer(true)} />
          <div className="glass-card" style={{ border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
            <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>52x ROI Detected <ArrowUpRight size={16} /></h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>Your current Nostro Liberation Index is groundbreaking.</p>
            <Link to="/roi" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px' }}>
              View ROI Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
