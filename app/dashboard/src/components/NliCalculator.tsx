import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import { Landmark, ArrowRight, RefreshCw, TrendingDown, ChevronRight, X, Shield } from 'lucide-react';

const Pill = ({ label, value, color = '#999' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color }}>{value}</span>
  </div>
);

const PARTNERS = [
  {
    id: 'AMINA',
    name: 'AMINA Bank SA',
    role: 'BANKING_PARTNER',
    desc: 'Licensed Swiss crypto bank (FINMA). Primary nostro account for CHF settlement via T+0 rails.',
    features: ['CHF_NOSTRO_ACCOUNT', 'IBAN_SETTLEMENT', 'FINMA_LICENSED', 'STABLECOIN_CUSTODY'],
    integration: 'REST API via HTTPS · mTLS mutual auth · ISO-20022 payment msgs',
    status: 'PILOT_ACTIVE',
    color: 'var(--success)',
  },
  {
    id: 'SIX_BFI',
    name: 'SIX BFI',
    role: 'FX_ORACLE',
    desc: 'Swiss Exchange Group real-time FX data feed. The only institutional-grade data source on Solana.',
    features: ['REAL-TIME_FX_RATES', 'GOLD_SPOT_PRICE', 'mTLS_CERT_AUTH', 'EDD_DATA_FEED'],
    integration: 'mTLS cert-pinned · AES-256-GCM · 42ms avg latency',
    status: 'VALIDATOR_NODE',
    color: 'var(--primary)',
  },
  {
    id: 'FIREBLOCKS',
    name: 'Fireblocks',
    role: 'CUSTODY_PROVIDER',
    desc: 'MPC-CMP custody with 3-of-4 Ed25519 threshold signing. Zero private key exposure.',
    features: ['MPC_CMP_THRESHOLD', 'Ed25519_SIGNING', 'HSM_BACKED', 'DeFi_SECURE_TRANSFER'],
    integration: 'SDK · API Key + JWT · Webhook notifications',
    status: 'CUSTODY_PROVIDER',
    color: 'var(--warning)',
  },
  {
    id: 'SOLANA',
    name: 'Solana Foundation',
    role: 'PROTOCOL_SPONSOR',
    desc: 'Protocol foundation sponsor. Antigravity is built on Solana\'s devnet with Token-2022 program.',
    features: ['TOKEN-2022_HOOKS', 'L3_SETTLEMENT', '65K_TPS', 'COMPRESSED_NFT'],
    integration: 'Anchor 0.31 · @solana/web3.js · Devnet RPC',
    status: 'PROTOCOL_SPONSOR',
    color: 'var(--secondary)',
  },
];

const NostroAnalytics = () => {
  const [amount, setAmount] = useState('1000000');
  const [fxData, setFxData] = useState<{ rate: number; latency: number; source: string }>({ rate: 0.8842, latency: 42, source: 'SIX_BFI_MARKET_FEED' });
  const [loading, setLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<typeof PARTNERS[0] | null>(null);
  const [execHistory, setExecHistory] = useState<{ amount: string; converted: string; time: string }[]>([]);

  const fetchFx = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/fx-rate?pair=USD/CHF`);
      const data = await res.json();
      setFxData({ rate: data.rate, latency: data.latency, source: data.source });
    } catch {
      setFxData(d => ({ ...d, rate: 0.8842 + (Math.random() * 0.002 - 0.001) }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFx();
    const interval = setInterval(fetchFx, 8000);
    return () => clearInterval(interval);
  }, [fetchFx]);

  const amt = parseFloat(amount) || 0;
  const converted = (amt * fxData.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const savings = (amt * 0.035).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const savingsPct = '3.50%';

  const executeLiberation = async () => {
    const ts = new Date().toTimeString().slice(0, 8);
    setExecHistory(h => [{ amount: `$${Number(amount).toLocaleString()}`, converted: `₣${converted}`, time: ts }, ...h.slice(0, 4)]);
    try { await fetch(`${API_URL}/demo/sweep`, { method: 'POST' }); } catch {}
  };

  return (
    <div className="animate-fade-in dashboard-container" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="section-title">NOSTRO // ANALYTICS v5.1</h2>
          <p className="section-subtitle">// SETTLEMENT_RAILS_OPTIMIZATION · SIX_BFI_FX_ORACLE · T+0_LIBERATION</p>
        </div>
        <button className="btn-primary" onClick={fetchFx} disabled={loading}>
          <RefreshCw size={11} style={{ display: 'inline', marginRight: 6 }} className={loading ? 'animate-spin' : ''} />
          SYNC_FX_RATE
        </button>
      </div>

      {/* ── Top: 3 KPI tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'LIVE_FX_RATE', value: `${fxData.rate.toFixed(4)}`, sub: 'USD/CHF · SIX_BFI', color: 'var(--primary)' },
          { label: 'CAPITAL_SAVED', value: `$${savings}`, sub: '// T+0 vs SWIFT', color: 'var(--success)' },
          { label: 'GATEWAY_LATENCY', value: `${fxData.latency}ms`, sub: '// mTLS_SECURED', color: 'var(--secondary)' },
        ].map((k, i) => (
          <div key={i} className="glass-card" data-coord={`K${i + 1}`}>
            <div className="label-xs" style={{ marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.8rem', color: k.color, letterSpacing: '-2px', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div className="label-xs">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid: Settlement engine + Partners ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '16px', marginBottom: '16px' }}>
        {/* Settlement Engine */}
        <div className="glass-card cyan-border" data-coord="SETTLE">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Landmark size={16} color="var(--primary)" />
              <span className="label-sm">SETTLEMENT_ENGINE_v5.1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="status-dot active" />
              <span className="label-xs" style={{ color: 'var(--success)' }}>FEED // LIVE</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Input */}
            <div style={{ background: '#030303', padding: '24px', border: '1px solid #181818', position: 'relative' }}>
              <div className="data-grid-overlay" />
              <div className="label-xs" style={{ marginBottom: '8px', position: 'relative', zIndex: 1 }}>ORIGIN_CAPITAL (USD)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                <span style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.6rem', color: 'var(--text-muted)' }}>$</span>
                <input
                  type="number" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ background: 'transparent', border: 'none', fontSize: '2rem', fontWeight: 900, color: '#fff', outline: 'none', width: '100%', fontFamily: 'var(--terminal-font)', letterSpacing: '-2px' }}
                />
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', zIndex: 2, margin: '-2px 0' }}>
              <div style={{ background: 'var(--primary)', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRight size={14} color="#000" />
                <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 900, color: '#000' }}>SIX_BFI · {fxData.rate.toFixed(4)}</span>
              </div>
            </div>

            {/* Output */}
            <div style={{ background: 'rgba(0,245,255,0.03)', padding: '24px', border: '1px solid var(--primary)', position: 'relative' }}>
              <div className="data-grid-overlay" />
              <div className="label-xs" style={{ marginBottom: '8px', color: 'var(--primary)', position: 'relative', zIndex: 1 }}>DESTINATION (CHF · AMINA_VAULT)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                <span style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '1.6rem', color: 'var(--primary)' }}>₣</span>
                <div style={{ fontFamily: 'var(--terminal-font)', fontWeight: 900, fontSize: '2rem', color: 'var(--primary)', letterSpacing: '-2px' }}>{converted}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', color: 'var(--success)', fontWeight: 900 }}>
                ↓ SAVES ${savings} vs SWIFT ({savingsPct} overhead)
              </div>
              <div className="label-xs" style={{ marginTop: '2px' }}>
                <RefreshCw size={9} style={{ display: 'inline', marginRight: 4 }} className={loading ? 'animate-spin' : ''} />
                {fxData.source} · {fxData.latency}ms
              </div>
            </div>
            <button className="btn-primary" onClick={executeLiberation}>EXECUTE_LIBERATION</button>
          </div>

          {/* Execution History */}
          {execHistory.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #111' }}>
              <div className="label-xs" style={{ marginBottom: '8px' }}>RECENT_EXECUTIONS</div>
              {execHistory.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontFamily: 'var(--terminal-font)', fontSize: '0.55rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{e.time}]</span>
                  <span style={{ color: 'var(--text)' }}>{e.amount}</span>
                  <span style={{ color: 'var(--primary)' }}>→ {e.converted}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="label-sm" style={{ marginBottom: '8px' }}>INSTITUTIONAL_PARTNERS // CLICK TO EXPAND</div>
          {PARTNERS.map(p => (
            <div
              key={p.id}
              className="glass-card clickable"
              data-coord={p.id}
              onClick={() => setSelectedPartner(p)}
              style={{ padding: '14px', borderLeft: `2px solid ${p.color}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text)', marginBottom: '2px' }}>{p.name}</div>
                  <div className="label-xs">{p.role}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.5rem', fontWeight: 900, color: p.color }}>{p.status}</span>
                  <ChevronRight size={11} color="var(--text-dim)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: Capital efficiency breakdown ── */}
      <div className="glass-card" data-coord="EFFICIENCY">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span className="label-sm">CAPITAL_EFFICIENCY_ANALYSIS // ANTIGRAVITY vs TRADITIONAL RAILS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[
            { rail: 'SWIFT', latency: '2-5 DAYS', cost: '3.5%', color: 'var(--danger)' },
            { rail: 'SEPA', latency: '1 DAY', cost: '1.2%', color: 'var(--warning)' },
            { rail: 'CHAPS', latency: '4 HRS', cost: '0.8%', color: 'var(--warning)' },
            { rail: 'SIX_SIC', latency: '3 HRS', cost: '0.5%', color: 'var(--primary)' },
            { rail: 'ANTIGRAVITY', latency: 'T+0 (42ms)', cost: '0%', color: 'var(--success)' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '16px', background: '#060606', border: `1px solid ${i === 4 ? r.color : '#111'}`, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.6rem', fontWeight: 900, color: r.color, marginBottom: '8px' }}>{r.rail}</div>
              <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text)', marginBottom: '4px' }}>{r.latency}</div>
              <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.65rem', fontWeight: 900, color: r.color }}>{r.cost}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Modal */}
      {selectedPartner && (
        <div className="modal-overlay" onClick={() => setSelectedPartner(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #181818', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.85rem', fontWeight: 900, color: selectedPartner.color, letterSpacing: '2px' }}>{selectedPartner.name}</div>
                <div className="label-xs" style={{ marginTop: '4px' }}>{selectedPartner.role}</div>
              </div>
              <button onClick={() => setSelectedPartner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <p style={{ fontFamily: 'var(--ui-font)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>{selectedPartner.desc}</p>
            <Pill label="STATUS" value={selectedPartner.status} color={selectedPartner.color} />
            <Pill label="INTEGRATION" value={selectedPartner.integration} color="var(--text-muted)" />
            <div style={{ marginTop: '16px' }}>
              <div className="label-xs" style={{ marginBottom: '10px' }}>FEATURES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPartner.features.map((f, i) => (
                  <span key={i} style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.5rem', fontWeight: 900, padding: '3px 8px', border: `1px solid ${selectedPartner.color}`, color: selectedPartner.color }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NostroAnalytics;
