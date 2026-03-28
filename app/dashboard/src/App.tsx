import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Overview from './components/Overview';
import LiquidityHub from './components/LiquidityHub';
import ComplianceCenter from './components/ComplianceCenter';
import NostroAnalytics from './components/NliCalculator';
import AdminPanel from './components/AdminPanel';

const NavItem = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`nav-link${active ? ' active' : ''}`}>
      {label}
    </Link>
  );
};

const PartnerMarquee = () => (
  <div className="partner-marquee">
    {['SOLANA FOUNDATION', 'AMINA BANK SA', 'SIX BFI', 'UBS AG', 'FIREBLOCKS', 'KEYROCK', 'SUPERTEAM GERMANY', 'STEAKHOUSE FINANCIAL', 'SOLSTICE', 'TENITY', 'FEATHERLESS AI', 'SOLANA FOUNDATION'].map((n, i) => (
      <span key={i} className="partner-logo">{n}</span>
    ))}
  </div>
);

const App = () => (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <div style={{ minHeight: '100vh' }}>
      <header className="header">
        <div className="logo-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--primary)', transform: 'rotate(45deg)', boxShadow: '0 0 8px var(--primary)' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '3px', color: 'var(--primary)', fontFamily: 'var(--terminal-font)' }}>ANTIGRAVITY</h1>
          </div>
          <div style={{ fontFamily: 'var(--terminal-font)', fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-dim)', borderLeft: '1px solid #282828', paddingLeft: '12px', marginLeft: '4px', letterSpacing: '1px' }}>
            INSTITUTIONAL HUB v5.1 // GRAND_PRIZE_EDITION
          </div>
        </div>

        <nav className="nav-menu">
          <NavItem to="/" label="OVERVIEW" />
          <NavItem to="/liquidity" label="LIQUIDITY" />
          <NavItem to="/compliance" label="COMPLIANCE" />
          <NavItem to="/roi" label="ANALYTICS" />
          <NavItem to="/admin" label="ADMIN" />
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'var(--terminal-font)', fontSize: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="status-dot active" />
            <span style={{ color: 'var(--text-muted)' }}>SIX BFI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="status-dot cyan" />
            <span style={{ color: 'var(--text-muted)' }}>FIREBLOCKS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="status-dot" style={{ background: '#333' }} />
            <span style={{ color: 'var(--text-dim)' }}>DEVNET</span>
          </div>
        </div>
      </header>

      <PartnerMarquee />

      <main className="main-content">
        <div className="dashboard-container">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/liquidity" element={<LiquidityHub />} />
            <Route path="/compliance" element={<ComplianceCenter />} />
            <Route path="/roi" element={<NostroAnalytics />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </main>
    </div>
  </Router>
);

export default App;
