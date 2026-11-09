import { useEffect, useRef } from 'react';

const moeda = (valor, currency = 'USD') => valor === null ? 'Não disponível' : new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency,
}).format(valor);

export default function AlertDetailsDrawer({ sinal, onClose, onNetwork, currency = 'USD' }) {
  const closeRef = useRef(null);
  const drawerRef = useRef(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCallback.current();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll('button:not([disabled]), a[href]'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return <>
    <button type="button" className="nl-alerts-backdrop" onClick={onClose} aria-label="Fechar detalhes" />
    <aside className="nl-alerts-drawer" role="dialog" aria-modal="true" aria-labelledby="nl-alert-drawer-title" ref={drawerRef}>
      <header className="nl-alerts-drawer-header">
        <div><span className="nl-alerts-overline">ANÁLISE ESTRUTURAL</span><h2 id="nl-alert-drawer-title">Detalhes para revisão</h2></div>
        <button ref={closeRef} type="button" className="nl-alerts-close" aria-label="Fechar painel" onClick={onClose}>×</button>
      </header>
      <div className="nl-alerts-drawer-content">
        <div className={'nl-alerts-drawer-hero nl-alerts-drawer-hero--' + sinal.nivel}>
          <span className="nl-alerts-drawer-dot" aria-hidden="true" />
          <div><span>CLASSIFICAÇÃO DA CONTA</span><strong>{sinal.nivel === 'alto' ? 'Risco alto' : 'Risco médio'}</strong></div>
        </div>
        <section className="nl-alerts-drawer-block">
          <h3>Conta analisada</h3><strong>{sinal.nome}</strong>
          <code>{sinal.id}</code>
        </section>
        <section className="nl-alerts-drawer-block">
          <h3>Por que esta conta aparece aqui?</h3>
          <p>{sinal.texto} A classificação foi produzida pelo backend a partir de métricas de conexões, influência e posição na rede.</p>
          <p>Esta etapa ainda não possui regras adicionais para identificar padrões específicos de transações.</p>
        </section>
        <div className="nl-alerts-drawer-stats">
          <div><span>Contas conectadas</span><strong>{sinal.grau}</strong></div>
          <div><span>Transações relacionadas</span><strong>{sinal.transacoes}</strong></div>
        </div>
        <div className="nl-alerts-drawer-volume"><span>Volume relacionado</span><strong>{moeda(sinal.volume, currency)}</strong></div>
        <div className="nl-alerts-disclaimer">Este sinal é uma indicação heurística para revisão, não uma confirmação de fraude. Não há data nem status de investigação disponíveis neste endpoint.</div>
        <button type="button" className="nl-alerts-open-network" onClick={onNetwork}>Abrir Rede Financeira <span aria-hidden="true">↗</span></button>
      </div>
    </aside>
  </>;
}
