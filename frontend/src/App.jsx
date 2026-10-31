import { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import './styles/app-shell.css';

const pages = {
  overview: { title: 'Visão geral', subtitle: 'Acompanhe os indicadores da rede financeira.' },
  transactions: { title: 'Transações', subtitle: 'Consulte movimentações e detalhes de transferências.' },
  alerts: { title: 'Alertas', subtitle: 'Revise sinais que merecem atenção.' },
  network: { title: 'Rede financeira', subtitle: 'Explore conexões e relacionamentos entre contas.' },
  cases: { title: 'Investigações', subtitle: 'Organize evidências e acompanhe casos.' },
  ai: { title: 'Nexus AI', subtitle: 'Gere pareceres explicativos com Gemini.' },
  reports: { title: 'Relatórios', subtitle: 'Consulte análises geradas anteriormente.' },
  settings: { title: 'Configurações', subtitle: 'Personalize sua experiência.' },
};

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = pages[activePage];

  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  function navigate(page) {
    setActivePage(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  return (
    <div className={'nl-app ' + (collapsed ? 'nl-app--collapsed' : '')}>
      <a className="nl-skip" href="#conteudo-principal">Pular para o conteúdo</a>
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="nl-content">
        <header className="nl-topbar">
          <div className="nl-topbar-start">
            <button type="button" className="nl-mobile-menu-button" aria-label="Abrir menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <div className="nl-breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{current.title}</strong></div>
          </div>
          <div className="nl-topbar-end"><span className="nl-demo-label">AMBIENTE DEMONSTRATIVO</span><span className="nl-demo-avatar" aria-label="Modo demonstração">NL</span></div>
        </header>
        <div id="conteudo-principal" className="nl-page" tabIndex={-1}>
          {activePage === 'overview' ? <Dashboard /> : (
            <main className="nl-placeholder" aria-labelledby="nl-placeholder-title">
              <span className="nl-eyebrow">NEXUSLENS 2.0 / EM DESENVOLVIMENTO</span>
              <h1 id="nl-placeholder-title">{current.title}</h1>
              <p>{current.subtitle}</p>
              <section className="nl-placeholder-card">
                <span className="nl-placeholder-icon" aria-hidden="true">◇</span>
                <h2>Esta página vem na próxima etapa.</h2>
                <p>O menu já está pronto. Vamos implementar as funcionalidades desta área em commits separados, aproveitando os serviços existentes.</p>
                <button type="button" className="nl-back-button" onClick={() => navigate('overview')}>Voltar à visão geral</button>
              </section>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
