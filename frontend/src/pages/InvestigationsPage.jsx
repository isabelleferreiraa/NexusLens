import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import DatasetNotice from '../components/layout/DatasetNotice';
import { validarRespostaDePadrao } from '../utils/patternAlerts';
import { filterQueue, summarizeQueue, PATTERN_NAMES } from '../utils/investigations';
import '../styles/investigations.css';

const money = value => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'USD'}).format(value);
const date = value => {
  if (!value) return '—';
  const [day, time] = value.split('T');
  const [year, month, date] = day.split('-');
  return `${date}/${month}/${year}${time ? ' · ' + time.slice(0,5) : ''}`;
};

function EvidenceDrawer({ signal, onClose, onNetwork }) {
  const firstRef = useRef(null);
  const panelRef = useRef(null);
  useEffect(() => {
    const original = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstRef.current?.focus();
    function onKey(event) {
      if (event.key === 'Escape') {event.preventDefault(); onClose(); return;}
      if (event.key !== 'Tab') return;
      const controls = [...panelRef.current.querySelectorAll('button:not([disabled]),a[href]')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {event.preventDefault(); controls.at(-1).focus();}
      if (!event.shiftKey && document.activeElement === controls.at(-1)) {event.preventDefault(); controls[0].focus();}
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
      if (original?.isConnected) original.focus();
    };
  }, [onClose]);
  return <>
    <button type="button" className="nl-inv-backdrop" onClick={onClose} aria-label="Fechar evidências" />
    <aside className="nl-inv-drawer" role="dialog" aria-modal="true" ref={panelRef} aria-labelledby="nl-inv-detail-title">
      <header><div><small>EVIDÊNCIAS · IBM AML-DATA</small><h2 id="nl-inv-detail-title">{signal.titulo}</h2></div><button ref={firstRef} type="button" onClick={onClose} aria-label="Fechar painel">×</button></header>
      <div className="nl-inv-drawer-body">
        <span className={'nl-inv-priority nl-inv-priority--'+signal.nivel}>{signal.nivel === 'alto' ? 'Prioridade alta' : 'Prioridade média'}</span>
        <p>{signal.descricao}</p>
        <div className="nl-inv-facts"><div><small>Transações</small><strong>{signal.quantidade_evidencias}</strong></div><div><small>Contas</small><strong>{signal.contas.length}</strong></div></div>
        <div className="nl-inv-volume"><small>Volume relacionado · USD</small><strong>{money(signal.valor_relacionado)}</strong></div>
        <div className="nl-inv-period"><small>Período observado</small><strong>{date(signal.inicio)} — {date(signal.fim)}</strong></div>
        <section><h3>Contas envolvidas</h3><div className="nl-inv-evidence">{signal.contas.map(id=><code key={id}>{id}</code>)}</div></section>
        <section><h3>Transações relacionadas</h3><div className="nl-inv-evidence">{signal.transacoes_ids.map(id=><code key={id}>{id}</code>)}</div></section>
        <p className="nl-inv-disclaimer">Sinal heurístico, não uma investigação aberta nem prova de fraude. Nenhum status é salvo nesta versão.</p>
        <button type="button" className="nl-inv-open" onClick={onNetwork}>Explorar Rede Financeira ↗</button>
      </div>
    </aside>
  </>;
}

export default function InvestigationsPage({onNavigate}) {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [reload,setReload] = useState(0);
  const [mode,setMode] = useState('table');
  const [search,setSearch] = useState('');
  const [severity,setSeverity] = useState('todos');
  const [pattern,setPattern] = useState('todos');
  const [selectedId,setSelectedId] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);setError('');setData(null);setSelectedId(null);
      try {
        const result = await api.get('/datasets/ibm-aml/alertas',{params:{limit:1500,max_eventos:100}});
        if (!validarRespostaDePadrao(result.data)) throw new Error('Contrato inválido');
        if(active) setData(result.data);
      } catch(err) {
        console.error('Falha ao carregar fila exploratória IBM:',err);
        if(active) setError('Não foi possível carregar os sinais IBM. Verifique a API e tente novamente.');
      } finally {if(active) setLoading(false);}
    }
    load();
    return()=>{active=false;};
  },[reload]);
  const signals=useMemo(()=>data?.alertas ?? [],[data]);
  const queue=useMemo(()=>filterQueue(signals,{search,severity,pattern}),[signals,search,severity,pattern]);
  const stats=useMemo(()=>summarizeQueue(signals),[signals]);
  const selected=signals.find(s=>s.id===selectedId)??null;
  const unavailable=Boolean(data && !data.disponivel);
  const seeDetails=id=>setSelectedId(id);

  return <main className="nl-investigations" aria-labelledby="nl-investigations-title">
    <header className="nl-inv-header">
      <div><span className="nl-inv-kicker">REVISÃO ESTRUTURADA / IBM AML-DATA</span><h1 id="nl-investigations-title">INVESTIGAÇÕES</h1><p>Explore sinais detectados, compare evidências e priorize sua análise.</p></div>
      <button className="nl-inv-refresh" type="button" onClick={()=>setReload(x=>x+1)} disabled={loading}>↻ {loading?'Carregando...':'Atualizar sinais'}</button>
    </header>
    <DatasetNotice unavailable={unavailable} status={data?.situacao}/>
    <div className="nl-inv-explanation"><strong>Fila de revisão, não casos persistidos.</strong> Os sinais são recalculados pela API IBM. Atribuição de responsáveis, mudança de status e armazenamento de investigações serão adicionados após criarmos um backend seguro para isso.</div>
    {loading && <p role="status" className="nl-inv-state">Buscando padrões no recorte IBM...</p>}
    {error && <p role="alert" className="nl-inv-state nl-inv-state--error">{error} <button type="button" onClick={()=>setReload(x=>x+1)}>Tentar novamente</button></p>}
    {!loading && data?.disponivel && <>
      <div className="nl-inv-summary">
        <article><small>SINAIS PARA REVISÃO</small><strong>{stats.total}</strong><span>Padrões heurísticos detectados</span></article>
        <article><small>PRIORIDADE ALTA</small><strong>{stats.high}</strong><span>Revisar primeiro</span></article>
        <article><small>PRIORIDADE MÉDIA</small><strong>{stats.medium}</strong><span>Acompanhar conexões</span></article>
        <article><small>TRANSAÇÕES DISTINTAS</small><strong>{stats.evidence}</strong><span>Citadas como evidências</span></article>
      </div>
      <section className="nl-inv-panel" aria-labelledby="nl-inv-queue-title">
        <div className="nl-inv-panel-head"><div><span className="nl-inv-kicker">TRIAGEM FINANCEIRA</span><h2 id="nl-inv-queue-title">Fila de análise</h2><p>Recorte de {data.transacoes_analisadas.toLocaleString('pt-BR')} transações em USD{data.recorte_parcial?' · amostra parcial':''}.</p></div>
          <div className="nl-inv-view-toggle" role="group" aria-label="Modo de visualização"><button type="button" className={mode==='table'?'active':''} aria-pressed={mode==='table'} onClick={()=>setMode('table')}>Tabela</button><button type="button" className={mode==='board'?'active':''} aria-pressed={mode==='board'} onClick={()=>setMode('board')}>Quadro</button></div>
        </div>
        <div className="nl-inv-filters">
          <label>Pesquisar<input type="search" placeholder="Conta, sinal ou transação" value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <label>Prioridade<select value={severity} onChange={e=>setSeverity(e.target.value)}><option value="todos">Todas</option><option value="alto">Alta</option><option value="medio">Média</option></select></label>
          <label>Padrão<select value={pattern} onChange={e=>setPattern(e.target.value)}><option value="todos">Todos</option>{Object.entries(PATTERN_NAMES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        </div>
        {mode==='table' ? <div className="nl-inv-table-wrap"><table className="nl-inv-table"><thead><tr><th>Sinal identificado</th><th>Prioridade</th><th>Contas</th><th>Evidências</th><th>Janela inicial</th><th></th></tr></thead><tbody>{queue.map(signal=><tr key={signal.id}><td><strong>{signal.titulo}</strong><small>{PATTERN_NAMES[signal.regra]||signal.regra}</small></td><td><span className={'nl-inv-priority nl-inv-priority--'+signal.nivel}>{signal.nivel==='alto'?'Alta':'Média'}</span></td><td>{signal.contas.length}</td><td>{signal.quantidade_evidencias}</td><td>{date(signal.inicio)}</td><td><button type="button" onClick={()=>seeDetails(signal.id)}>Evidências ↗</button></td></tr>)}</tbody></table></div>
          : <div className="nl-inv-board">{['alto','medio'].map(level=><section key={level} className="nl-inv-board-column"><h3>{level==='alto'?'Prioridade alta':'Prioridade média'} <span>{queue.filter(x=>x.nivel===level).length}</span></h3><div>{queue.filter(x=>x.nivel===level).map(signal=><button type="button" key={signal.id} className="nl-inv-board-card" onClick={()=>seeDetails(signal.id)}><strong>{signal.titulo}</strong><small>{PATTERN_NAMES[signal.regra]}</small><span>{signal.quantidade_evidencias} transações · {signal.contas.length} contas</span></button>)}</div></section>)}</div>}
        {queue.length===0 && <p className="nl-inv-empty">Nenhum sinal encontrado com esses filtros.</p>}
        <footer>Os agrupamentos do quadro representam prioridade, não status de investigação. <button type="button" onClick={()=>{setSearch('');setSeverity('todos');setPattern('todos');}}>Limpar filtros</button></footer>
      </section>
    </>}
    {selected && <EvidenceDrawer signal={selected} onClose={()=>setSelectedId(null)} onNetwork={()=>{setSelectedId(null);onNavigate('network');}} />}
  </main>;
}
