import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Overview from './components/Overview';
import LiquidityHub from './components/LiquidityHub';
import ComplianceCenter from './components/ComplianceCenter';
import NliCalculator from './components/NliCalculator';

const NavItem = ({ to, label }: { to: string, label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
      {label}
    </Link>
  );
};

const App = () => {
  return (
    <Router>
      <div className="dashboard-container">
        <header className="header animate-slide-down">
          <div className="logo-section">
            <h1 className="logo-text">ANTIGRAVITY</h1>
            <span className="tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', marginLeft: '12px' }}>INSTITUTIONAL HUB v2.0</span>
          </div>
          <nav className="nav-menu">
            <NavItem to="/" label="Overview" />
            <NavItem to="/liquidity" label="Liquidity Hub" />
            <NavItem to="/compliance" label="Compliance" />
            <NavItem to="/roi" label="ROI Calculator" />
          </nav>
          <div className="user-profile">
            <div className="status-indicator"></div>
            <span>Solana Devnet: Connected</span>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/liquidity" element={<LiquidityHub />} />
            <Route path="/compliance" element={<ComplianceCenter />} />
            <Route path="/roi" element={<NliCalculator />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
