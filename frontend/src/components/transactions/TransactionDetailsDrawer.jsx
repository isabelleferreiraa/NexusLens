import { useEffect, useRef } from 'react';
import { formatarMoeda, formatarData } from '../../utils/transactions';

export default function TransactionDetailsDrawer({ transacao, onClose, onNetwork }) {
  const closeRef = useRef(null);
  const drawerRef = useRef(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function handleKeydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeCallback.current(); return; }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focaveis = [...drawerRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')];
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro.focus(); }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = overflowAnterior;
      if (elementoAnterior?.isConnected) elementoAnterior.focus();
    };
  }, []);

  return <>
    <button className="nl-tx-backdrop" aria-label="Fechar detalhes da transação" type="button" onClick={onClose}/>
    <aside ref={drawerRef} className="nl-tx-drawer" role="dialog" aria-modal="true" aria-labelledby="nl-tx-drawer-title">
      <div className="nl-tx-drawer-header">
        <div>
          <small>DETALHES DA MOVIMENTAÇÃO</small>
          <h2 id="nl-tx-drawer-title">Transação {transacao.identificador ? `#${transacao.identificador.slice(0, 8)}` : `— registro ${transacao.indice}`}</h2>
        </div>
        <button ref={closeRef} type="button" aria-label="Fechar painel de detalhes" className="nl-tx-close" onClick={onClose}>×</button>
      </div>
      <div className="nl-tx-drawer-body">
        <div className="nl-tx-amount">
          <small>VALOR TRANSFERIDO</small>
          <strong>{formatarMoeda(transacao.valor)}</strong>
        </div>
        <div className="nl-tx-drawer-section">
          <h3>Origem</h3>
          <p>{transacao.nomeOrigem || 'Nome não disponível'}</p>
          <code>{transacao.origem}</code>
        </div>
        <div className="nl-tx-flow-arrow" aria-hidden="true">↓</div>
        <div className="nl-tx-drawer-section">
          <h3>Destino</h3>
          <p>{transacao.nomeDestino || 'Nome não disponível'}</p>
          <code>{transacao.destino}</code>
        </div>
        <div className="nl-tx-drawer-grid">
          <div><span>Data</span><strong>{formatarData(transacao.data)}</strong></div>
          <div><span>Tipo</span><strong>{transacao.tipo || 'Não informado'}</strong></div>
        </div>
        <div className="nl-tx-info">Este registro mostra dados da transferência, não um diagnóstico de fraude. A análise das conexões fica na página Rede financeira.</div>
        <button type="button" className="nl-tx-go-network" onClick={onNetwork}>Abrir rede financeira ↗</button>
      </div>
    </aside>
  </>;
}
