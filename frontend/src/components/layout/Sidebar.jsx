import { pages } from '../../routes';
import './Sidebar.css';

const items = [
  { id: 'overview', label: 'Visão geral', icon: 'overview' },
  { id: 'transactions', label: 'Transações', icon: 'transactions' },
  { id: 'alerts', label: 'Alertas', icon: 'alerts' },
  { id: 'network', label: 'Rede financeira', icon: 'network' },
  { id: 'cases', label: 'Investigações', icon: 'cases' },
  { id: 'ai', label: 'Nexus AI', icon: 'ai' },
  { id: 'reports', label: 'Relatórios', icon: 'reports' },
  { id: 'settings', label: 'Configurações', icon: 'settings' },
];

function NavIcon({ name }) {
  const props = { viewBox: '0 0 24 24', width: 19, height: 19, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const drawing = {
    overview: <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></>,
    transactions: <><path d="m8 3-4 4 4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></>,
    alerts: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v5M12 17h.01"/></>,
    network: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="m7.7 7 3.2 9M16.3 7l-3.2 9M8 6h8"/></>,
    cases: <><path d="M10 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v3"/><circle cx="16" cy="16" r="3"/><path d="m18.5 18.5 3 3"/></>,
    ai: <><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z"/><path d="m19 18 .6 1.4L21 20l-1.4.6L19 22l-.6-1.4L17 20l1.4-.6L19 18Z"/></>,
    reports: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/><circle cx="12" cy="12" r="7"/></>,
  };
  return <svg {...props}>{drawing[name]}</svg>;
}

function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  return (
    <>
      <button
        className={'nl-sidebar-overlay ' + (mobileOpen ? 'nl-sidebar-overlay--visible' : '')}
        type="button"
        tabIndex={mobileOpen ? 0 : -1}
        aria-label="Fechar menu"
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
      />
      <aside className={'nl-sidebar ' + (mobileOpen ? 'nl-sidebar--open' : '')} aria-label="Menu lateral">
        <div className="nl-sidebar-brand">
          <img src="/nexuslens-mark.png" width="46" height="46" alt="" />
          <div className="nl-sidebar-brand-text"><strong>Nexus<span>Lens</span></strong><small>FINANCIAL INTELLIGENCE</small></div>
          <button type="button" className="nl-sidebar-mobile-close" onClick={onCloseMobile} aria-label="Fechar menu">×</button>
        </div>
        <button
          type="button"
          className="nl-sidebar-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
        </button>
        <span className="nl-sidebar-caption">MENU PRINCIPAL</span>
        <nav className="nl-sidebar-nav" aria-label="Páginas do NexusLens">
          {items.map((item) => (
            <a
              className={'nl-sidebar-link ' + (activePage === item.id ? 'nl-sidebar-link--active' : '')}
              href={pages[item.id].path}
              key={item.id}
              title={item.label}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                onNavigate(item.id);
              }}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <NavIcon name={item.icon}/>
              <span className="nl-sidebar-link-label">{item.label}</span>
              {activePage === item.id && <i className="nl-sidebar-active-dot" aria-hidden="true" />}
            </a>
          ))}
        </nav>
        <div className="nl-sidebar-demo">
          <span className="nl-sidebar-demo-dot" aria-hidden="true" />
          <div><strong>Ambiente demonstrativo</strong><p>Dados fictícios para explorar a plataforma.</p></div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
