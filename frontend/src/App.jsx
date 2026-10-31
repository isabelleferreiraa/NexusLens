import { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import NetworkPage from './pages/NetworkPage';
import NexusAIPage from './pages/NexusAIPage';
import { pages, pageFromPath } from './routes';
import './styles/app-shell.css';

function App() {
  const [activePage, setActivePage] = useState(() => pageFromPath(window.location.pathname));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = pages[activePage];

  useEffect(() => {
    function onPopstate() { setActivePage(pageFromPath(window.location.pathname)); setMobileOpen(false); }
    window.addEventListener('popstate', onPopstate);
    return () => window.removeEventListener('popstate', onPopstate);
  }, []);
  useEffect(() => { document.title = (current?.title ?? 'Página não encontrada') + ' | NexusLens'; }, [current]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  function navigate(page) {
    if (!pages[page]) return;
    if (window.location.pathname !== pages[page].path) window.history.pushState({}, '', pages[page].path);
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
            <div className="nl-breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{current?.title ?? 'Página não encontrada'}</strong></div>
          </div>
          <div className="nl-topbar-end"><span className="nl-demo-label">AMBIENTE DEMONSTRATIVO</span><span className="nl-demo-avatar" aria-label="Modo demonstração">NL</span></div>
        </header>
        <div id="conteudo-principal" className="nl-page" tabIndex={-1}>
          {activePage === 'overview' ? <Dashboard onNavigate={navigate}/> :
          activePage === 'transactions' ? <TransactionsPage/> :
          activePage === 'network' ? <NetworkPage/> :
          activePage === 'ai' ? <NexusAIPage/> : (
            <main className="nl-placeholder" aria-labelledby="nl-placeholder-title">
              <span className="nl-eyebrow">NEXUSLENS 2.0 / {current ? 'EM DESENVOLVIMENTO' : 'NÃO ENCONTRADA'}</span>
              <h1 id="nl-placeholder-title">{current?.title ?? 'Página não encontrada'}</h1>
              <p>{current?.subtitle ?? 'Não encontramos esse endereço.'}</p>
              <section className="nl-placeholder-card">
                <span className="nl-placeholder-icon" aria-hidden="true">◇</span>
                <h2>{current ? 'Esta página vem na próxima etapa.' : 'Vamos voltar ao início?'}</h2>
                <p>{current ? 'Estamos preparando esta funcionalidade. Os serviços existentes continuam acessíveis na Rede financeira e no Nexus AI.' : 'Use o botão abaixo para retornar à Visão Geral.'}</p>
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
