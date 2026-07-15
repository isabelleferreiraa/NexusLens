import './Header.css';

function Header() {
  return (
    <header className="nx-header">
      <div className="nx-header__inner">

        {/* Logo */}
        <div className="nx-header__brand">
          <div className="nx-header__logo-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="3.5" fill="#8B5CF6" />
              <circle cx="6"  cy="8"  r="2.5" fill="#38BDF8" />
              <circle cx="26" cy="8"  r="2.5" fill="#38BDF8" />
              <circle cx="6"  cy="24" r="2.5" fill="#8B5CF6" opacity="0.7" />
              <circle cx="26" cy="24" r="2.5" fill="#8B5CF6" opacity="0.7" />
              <line x1="16" y1="16" x2="6"  y2="8"  stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.6" />
              <line x1="16" y1="16" x2="26" y2="8"  stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.6" />
              <line x1="16" y1="16" x2="6"  y2="24" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.5" />
              <line x1="16" y1="16" x2="26" y2="24" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.5" />
              <line x1="6"  y1="8"  x2="26" y2="8"  stroke="#38BDF8" strokeWidth="1"   strokeOpacity="0.3" />
              <line x1="6"  y1="24" x2="26" y2="24" stroke="#8B5CF6" strokeWidth="1"   strokeOpacity="0.25" />
            </svg>
          </div>

          <div className="nx-header__brand-text">
            <span className="nx-header__logo-name">NexusLens</span>
            <span className="nx-header__logo-sub">Plataforma Inteligente de Análise Financeira</span>
          </div>
        </div>

        {/* Divider */}
        <div className="nx-header__divider" aria-hidden="true" />

        {/* Right side */}
        <div className="nx-header__right">

          {/* System status */}
          <div className="nx-header__status" title="Sistema operacional">
            <span className="nx-header__status-dot" aria-hidden="true" />
            <span className="nx-header__status-label">Online</span>
          </div>

          {/* Separator */}
          <div className="nx-header__sep" aria-hidden="true" />

          {/* User */}
          <div className="nx-header__user" title="Analista">
            <div className="nx-header__avatar" aria-label="Perfil do analista">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="8" cy="5.5" r="2.5" fill="#A78BFA" />
                <path d="M2.5 13.5C2.5 11.015 5 9 8 9s5.5 2.015 5.5 4.5" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="nx-header__user-info">
              <span className="nx-header__user-name">Analista</span>
              <span className="nx-header__user-role">Antifraude</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;
