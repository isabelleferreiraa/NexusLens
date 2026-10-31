import './Header.css';

function Header() {
  return (
    <header className="nx-header">
      <div className="nx-header__inner">

        {/* Logo */}
        <div className="nx-header__brand">
          <img
            className="nx-header__logo-image"
            src="/nexuslens-mark.png"
            width="42"
            height="42"
            alt=""
            aria-hidden="true"
          />
          <div className="nx-header__brand-text">
            <span className="nx-header__logo-name">Nexus<span>Lens</span></span>
            <span className="nx-header__logo-sub">Financial Intelligence</span>
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
