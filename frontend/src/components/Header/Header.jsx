import './Header.css';

function Header() {
  return (
    <header className="nx-header">
      <div className="nx-header__inner">

        {/* Logo */}
        <div className="nx-header__brand">
          <div className="nx-header__logo-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
            </svg>
          </div>
          <div className="nx-header__brand-text">
            <span className="nx-header__logo-name">NexusLens</span>
            <span className="nx-header__logo-sub">Financial Network Analysis</span>
          </div>
        </div>

        {/* Right side */}
        <div className="nx-header__right">

          {/* System status */}
          <div className="nx-header__status" title="System Status">
            <span className="nx-header__status-dot" aria-hidden="true" />
            <span className="nx-header__status-label">Operational</span>
          </div>

          <div className="nx-header__sep" aria-hidden="true" />

          {/* User */}
          <div className="nx-header__user" title="Analyst">
            <div className="nx-header__avatar" aria-label="Analyst Profile">
              <span>AF</span>
            </div>
            <div className="nx-header__user-info">
              <span className="nx-header__user-name">Analyst</span>
              <span className="nx-header__user-role">Fraud Dept</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;
