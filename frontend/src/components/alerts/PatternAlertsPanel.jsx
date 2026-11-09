import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import { filtrarAlertasDePadrao, resumirAlertasDePadrao, validarRespostaDePadrao } from '../../utils/patternAlerts';
import './PatternAlertsPanel.css';

const nomes = {
  ciclo_72h: 'Ciclo entre contas',
  ida_volta_24h: 'Transferências de ida e volta',
  dispersao_24h: 'Distribuição rápida',
};

const moeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(valor);
const data = (valor) => valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : '—';

function Detalhes({ alerta, onClose }) {
  const closeRef = useRef(null);
  const drawerRef = useRef(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeCallback.current(); return; }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll('button:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (before?.isConnected) before.focus();
    };
  }, []);
  return <>
    <button type="button" className="nx-pa-backdrop" aria-label="Fechar detalhes do padrão" onClick={onClose}/>
    <aside ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="nx-pa-drawer-title" className="nx-pa-drawer">
      <div className="nx-pa-drawer-head"><div><span className="nx-pa-kicker">PADRÃO OBSERVADO · IBM AML-DATA</span><h3 id="nx-pa-drawer-title">{alerta.titulo}</h3></div><button ref={closeRef} type="button" aria-label="Fechar detalhes" onClick={onClose}>×</button></div>
      <div className="nx-pa-drawer-body">
        <span className={'nx-pa-pill nx-pa-pill--' + alerta.nivel}>{alerta.nivel === 'alto' ? 'Prioridade alta' : 'Prioridade média'}</span>
        <p>{alerta.descricao}</p>
        <div className="nx-pa-mini"><span>Transações relacionadas</span><strong>{alerta.quantidade_evidencias}</strong></div>
        <div className="nx-pa-mini"><span>Volume relacionado (USD)</span><strong>{moeda(alerta.valor_relacionado)}</strong></div>
        <div className="nx-pa-mini"><span>Janela observada</span><strong>{data(alerta.inicio)} até {data(alerta.fim)}</strong></div>
        <h4>Contas do padrão</h4>
        <div className="nx-pa-evidence">{alerta.contas.map(id=><code key={id}>{id}</code>)}</div>
        <h4>Identificadores das transações</h4>
        <div className="nx-pa-evidence">{alerta.transacoes_ids.map(id=><code key={id}>{id}</code>)}</div>
        <p className="nx-pa-disclaimer">{alerta.observacao}</p>
      </div>
    </aside>
  </>;
}

export default function PatternAlertsPanel() {
  const [resposta, setResposta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [nivel, setNivel] = useState('todos');
  const [selecionadoId, setSelecionadoId] = useState(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true); setErro(''); setResposta(null);
      try {
        const response = await api.get('/datasets/ibm-aml/alertas', { params: { limit: 1500 } });
        if (!validarRespostaDePadrao(response.data)) throw new Error('Resposta IBM inválida');
        if (ativo) setResposta(response.data);
      } catch (error) {
        console.error('Não foi possível carregar padrões IBM:', error);
        if (ativo) setErro('Não foi possível carregar os padrões. Verifique se a API IBM já foi implantada.');
      } finally { if (ativo) setCarregando(false); }
    }
    carregar();
    return () => { ativo = false; };
  }, [versao]);
  const alertas = resposta?.alertas ?? [];
  const resumo = useMemo(() => resumirAlertasDePadrao(alertas), [alertas]);
  const filtrados = useMemo(() => filtrarAlertasDePadrao(alertas, { busca, tipo, nivel }), [alertas, busca, tipo, nivel]);
  const selecionado = alertas.find(a=>a.id === selecionadoId) ?? null;
  const indisponivel = resposta && !resposta.disponivel;

  return <section className="nx-pa-panel" aria-labelledby="nx-pa-title">
    <div className="nx-pa-top">
      <div><span className="nx-pa-kicker">DETECÇÃO EXPLICÁVEL · DADOS SINTÉTICOS</span><h2 id="nx-pa-title">Padrões nas transações</h2><p>Regras exploratórias aplicadas ao recorte IBM, sem utilizar os rótulos de lavagem do simulador.</p></div>
      <button type="button" onClick={() => setVersao(v => v + 1)} disabled={carregando}>↻ Reanalisar</button>
    </div>
    {carregando && <p className="nx-pa-status" role="status">Calculando padrões a partir do recorte IBM...</p>}
    {erro && <p className="nx-pa-status nx-pa-status--error" role="alert">{erro}</p>}
    {indisponivel && <p className="nx-pa-status" role="status">O dataset IBM ainda não foi importado. Nenhum padrão pode ser calculado.</p>}
    {resposta?.disponivel && <>
      <div className="nx-pa-stats">
        <div><small>SINAIS ENCONTRADOS</small><strong>{resumo.total}</strong></div>
        <div><small>PRIORIDADE ALTA</small><strong>{resumo.altos}</strong></div>
        <div><small>PRIORIDADE MÉDIA</small><strong>{resumo.medios}</strong></div>
      </div>
      <p className="nx-pa-hint">Análise de {resposta.transacoes_analisadas.toLocaleString('pt-BR')} transações em USD{resposta.recorte_parcial ? ' · recorte parcial do dataset' : ''}. Regras demonstrativas, não uma prova de irregularidade.</p>
      <div className="nx-pa-filters">
        <label>Pesquisar<input type="search" placeholder="Conta ou ID do sinal" value={busca} onChange={e=>setBusca(e.target.value)}/></label>
        <label>Tipo<select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="todos">Todos</option>{Object.entries(nomes).map(([id,nome])=><option value={id} key={id}>{nome}</option>)}</select></label>
        <label>Prioridade<select value={nivel} onChange={e=>setNivel(e.target.value)}><option value="todos">Todas</option><option value="alto">Alta</option><option value="medio">Média</option></select></label>
      </div>
      <div className="nx-pa-table-wrap"><table className="nx-pa-table">
        <thead><tr><th>Padrão observado</th><th>Prioridade</th><th>Contas</th><th>Transações</th><th></th></tr></thead>
        <tbody>{filtrados.map(alerta => <tr key={alerta.id}><td><strong>{alerta.titulo}</strong><small>{data(alerta.inicio)}</small></td><td><span className={'nx-pa-pill nx-pa-pill--'+alerta.nivel}>{alerta.nivel === 'alto' ? 'Alta' : 'Média'}</span></td><td>{alerta.contas.length}</td><td>{alerta.quantidade_evidencias}</td><td><button type="button" className="nx-pa-details" onClick={()=>setSelecionadoId(alerta.id)}>Detalhes ↗</button></td></tr>)}</tbody>
      </table></div>
      {!filtrados.length && <p className="nx-pa-empty">Nenhum padrão corresponde aos critérios selecionados.</p>}
    </>}
    {selecionado && <Detalhes alerta={selecionado} onClose={()=>setSelecionadoId(null)}/>}
  </section>;
}
