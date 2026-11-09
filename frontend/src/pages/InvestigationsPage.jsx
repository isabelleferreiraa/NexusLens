import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import DatasetNotice from '../components/layout/DatasetNotice';
import { validarRespostaDePadrao } from '../utils/patternAlerts';
import { filterQueue, PATTERN_NAMES } from '../utils/investigations';
import {
  CASE_STATUSES, LOCAL_CASES_KEY, loadLocalCases, persistLocalCases,
  addLocalCase, changeCaseStatus, updateCaseNote, summarizeCases, filterCases,
} from '../utils/localCases';
import '../styles/investigations.css';

const currency = amount => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'USD'}).format(amount);
const showDate = value => {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return '—';
  const [ymd,time] = value.split('T');
  const [y,m,d] = ymd.split('-');
  return `${d}/${m}/${y}${time ? ` · ${time.slice(0,5)}` : ''}`;
};
const stampDate = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('pt-BR', {dateStyle:'short',timeStyle:'short'}).format(new Date(value)) : '—';
const browserStore = () => typeof window === 'undefined' ? null : window.localStorage;

function getInitialCases() {
  try { return { cases:loadLocalCases(browserStore()), blocked:false, error:'' }; }
  catch { return {cases:[],blocked:true,error:'Não foi possível ler os casos neste navegador. Nenhum dado local foi substituído.'}; }
}

function EvidenceDrawer({ signal, record, onCreate, onChangeStatus, onSaveNote, onClose, onNetwork, canWrite, stale }) {
  const [note,setNote]=useState(record?.note ?? '');
  const [message,setMessage]=useState('');
  const closeRef=useRef(null), panelRef=useRef(null), latestClose=useRef(onClose);
  latestClose.current=onClose;
  useEffect(()=>{
    const focused=document.activeElement;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    closeRef.current?.focus();
    function keyDown(event) {
      if(event.key==='Escape') {event.preventDefault();latestClose.current();return;}
      if(event.key!=='Tab'||!panelRef.current)return;
      const controls=[...panelRef.current.querySelectorAll('button:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')];
      if(!controls.length)return;
      if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}
      else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}
    }
    document.addEventListener('keydown',keyDown);
    return ()=>{document.removeEventListener('keydown',keyDown);document.body.style.overflow=overflow;if(focused?.isConnected)focused.focus();};
  },[]);
  const create=()=>{if(onCreate(signal))setMessage('Caso criado neste navegador.');};
  const save=(event)=>{event.preventDefault();if(onSaveNote(record.id,note))setMessage('Observação salva neste navegador.');};
  return <>
    <button type="button" className="nl-inv-backdrop" aria-label="Fechar detalhes" onClick={onClose}/>
    <aside ref={panelRef} className="nl-inv-drawer" role="dialog" aria-modal="true" aria-labelledby="nl-inv-detail-title">
      <header><div><small>INVESTIGAÇÕES · IBM AML-DATA</small><h2 id="nl-inv-detail-title">{signal.titulo}</h2></div>
        <button ref={closeRef} type="button" aria-label="Fechar painel" onClick={onClose}>×</button></header>
      <div className="nl-inv-drawer-body">
        <span className={'nl-inv-priority nl-inv-priority--'+signal.nivel}>{signal.nivel==='alto'?'Prioridade alta':'Prioridade média'}</span>
        {stale&&<p className="nl-inv-state">Este sinal não está no recorte atual da API. Os detalhes abaixo são o registro local da abertura do caso.</p>}
        <p>{signal.descricao}</p>
        <div className="nl-inv-facts"><div><small>Transações citadas</small><strong>{signal.quantidade_evidencias}</strong></div><div><small>Contas</small><strong>{signal.contas.length}</strong></div></div>
        <div className="nl-inv-volume"><small>Volume relacionado · USD</small><strong>{currency(signal.valor_relacionado)}</strong></div>
        <div className="nl-inv-period"><small>Período observado</small><strong>{showDate(signal.inicio)} — {showDate(signal.fim)}</strong></div>
        <section><h3>Contas envolvidas</h3><div className="nl-inv-evidence">{signal.contas.map(id=><code key={id}>{id}</code>)}</div></section>
        <section><h3>Transações citadas como evidências</h3><div className="nl-inv-evidence">{signal.transacoes_ids.map(id=><code key={id}>{id}</code>)}</div></section>
        {!record&&<div className="nl-inv-case-actions"><h3>Começar acompanhamento</h3><p>Abra um caso local para registrar status e observações neste navegador. Nenhum caso será enviado ao servidor.</p>
          <button type="button" className="nl-inv-open" onClick={create} disabled={!canWrite}>Abrir caso local</button></div>}
        {record&&<div className="nl-inv-case-actions"><h3>Acompanhamento local</h3>
          <label>Situação do caso
            <select value={record.status} disabled={!canWrite} onChange={e=>{onChangeStatus(record.id,e.target.value);setMessage('');}}>
              {Object.entries(CASE_STATUSES).map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <form onSubmit={save}><label>Observações (até 800 caracteres)
            <textarea rows={4} value={note} onChange={e=>{setNote(e.target.value);setMessage('');}} maxLength={800} disabled={!canWrite} placeholder="Registre somente observações sobre os dados sintéticos"/>
          </label><button type="submit" disabled={!canWrite||note.trim()===record.note}>Salvar observação</button></form>
          <p className="nl-inv-case-time">Caso aberto em {stampDate(record.createdAt)} · Atualizado em {stampDate(record.updatedAt)}</p>
          <section><h3>Histórico de situações</h3><ol className="nl-inv-history">{record.history.map((entry,index)=><li key={index}><strong>{CASE_STATUSES[entry.status]}</strong><small>{stampDate(entry.at)} · {entry.action==='criado'?'Caso aberto':entry.action==='observacao'?'Observação atualizada':'Status atualizado'}</small></li>)}</ol></section>
        </div>}
        {message&&<p role="status" className="nl-inv-save-message">{message}</p>}
        <p className="nl-inv-disclaimer">Sinal heurístico, não comprovação de irregularidade. Estes casos não são compartilhados e não possuem autenticação, auditoria de servidor ou backup automático.</p>
        <button type="button" className="nl-inv-open" onClick={onNetwork}>Explorar Rede Financeira ↗</button>
      </div>
    </aside>
  </>;
}

export default function InvestigationsPage({onNavigate}) {
  const [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  const [local,setLocal]=useState(getInitialCases);
  const [mode,setMode]=useState('board');
  const [caseSearch,setCaseSearch]=useState(''),[caseStatus,setCaseStatus]=useState('todos');
  const [search,setSearch]=useState(''),[severity,setSeverity]=useState('todos'),[pattern,setPattern]=useState('todos');
  const [selectedId,setSelectedId]=useState(null);
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    let active=true;
    async function load() {
      setLoading(true);setError('');setData(null);
      try {
        const result=await api.get('/datasets/ibm-aml/alertas',{params:{limit:1500,max_eventos:100}});
        if(!validarRespostaDePadrao(result.data))throw new Error('Contrato inválido');
        if(active)setData(result.data);
      } catch(err){console.error('Falha ao carregar sinais IBM:',err);if(active)setError('Não foi possível carregar os sinais IBM. Verifique a API e tente novamente.');}
      finally{if(active)setLoading(false);}
    }
    load();return()=>{active=false;};
  },[reload]);

  useEffect(()=>{
    const sync=(e)=>{
      if(e.key!==LOCAL_CASES_KEY&&e.key!==null)return;
      try {setLocal({cases:loadLocalCases(browserStore()),blocked:false,error:''});}
      catch {setLocal(previous=>({...previous,blocked:true,error:'Os casos locais foram modificados em outra aba e não puderam ser lidos.'}));}
    };
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);

  function persist(next) {
    if(local.blocked)return false;
    try {
      persistLocalCases(browserStore(),next);
      setLocal({cases:next,blocked:false,error:''});
      setNotice('');return true;
    } catch(err) {
      console.error('Falha ao persistir caso local:',err);
      setNotice('Não foi possível salvar no navegador. Verifique se o armazenamento está habilitado e há espaço disponível.');
      return false;
    }
  }
  function create(signal){
    try{return persist(addLocalCase(local.cases,signal,new Date().toISOString()));}
    catch(err){setNotice(err.message);return false;}
  }
  function changeStatus(id,status){
    try{return persist(changeCaseStatus(local.cases,id,status,new Date().toISOString()));}
    catch(err){setNotice(err.message);return false;}
  }
  function saveNote(id,note){
    try{return persist(updateCaseNote(local.cases,id,note,new Date().toISOString()));}
    catch(err){setNotice(err.message);return false;}
  }
  function handleDrop(event,status){
    event.preventDefault();
    const id=event.dataTransfer.getData('text/plain');
    if(local.cases.some(c=>c.id===id))changeStatus(id,status);
  }

  const signals=useMemo(()=>data?.alertas??[],[data]);
  const queue=useMemo(()=>filterQueue(signals,{search,severity,pattern}),[signals,search,severity,pattern]);
  const cases=useMemo(()=>filterCases(local.cases,{search:caseSearch,status:caseStatus}),[local.cases,caseSearch,caseStatus]);
  const stats=useMemo(()=>summarizeCases(local.cases),[local.cases]);
  const selectedRecord=local.cases.find(c=>c.signalId===selectedId)??null;
  const selectedLiveSignal=signals.find(s=>s.id===selectedId)??null;
  const selectedSignal=selectedLiveSignal??selectedRecord?.signal??null;
  const unavailable=Boolean(data&&!data.disponivel);
  return <main className="nl-investigations" aria-labelledby="nl-investigations-title">
    <header className="nl-inv-header"><div><span className="nl-inv-kicker">ACOMPANHAMENTO DE SINAIS / IBM AML-DATA</span><h1 id="nl-investigations-title">INVESTIGAÇÕES</h1><p>Abra casos de revisão, acompanhe situações e consulte as evidências do conjunto sintético.</p></div>
      <button type="button" className="nl-inv-refresh" onClick={()=>setReload(v=>v+1)} disabled={loading}>↻ {loading?'Atualizando...':'Atualizar sinais'}</button>
    </header>
    <DatasetNotice unavailable={unavailable} status={data?.situacao}/>
    <div className="nl-inv-explanation"><strong>Modo demonstrativo local.</strong> Casos, situações e observações são salvos apenas neste navegador. Não há sincronização entre dispositivos, backup automático ou controle de acesso. Não insira informações pessoais ou bancárias reais.</div>
    {(local.error||notice)&&<p role="alert" className="nl-inv-state nl-inv-state--error">{local.error||notice}</p>}
    <section aria-labelledby="nl-inv-cases-title">
      <div className="nl-inv-section-intro"><div><span className="nl-inv-kicker">CASOS ABERTOS MANUALMENTE</span><h2 id="nl-inv-cases-title">Acompanhamento</h2></div>
        <span className="nl-inv-local-pill">Salvo neste navegador</span></div>
      <div className="nl-inv-summary" aria-label="Resumo dos casos locais">
        <article><small>TOTAL DE CASOS</small><strong>{stats.total}</strong><span>Criados neste navegador</span></article>
        <article><small>ABERTOS</small><strong>{stats.aberto}</strong><span>Aguardando revisão</span></article>
        <article><small>EM ANÁLISE</small><strong>{stats.em_analise}</strong><span>Acompanhamento iniciado</span></article>
        <article><small>CONCLUÍDOS</small><strong>{stats.concluido}</strong><span>Encerrados localmente</span></article>
      </div>
      <div className="nl-inv-panel">
        <div className="nl-inv-panel-head"><div><h2>Meus casos</h2><p>Crie casos a partir dos sinais IBM abaixo. Use o quadro para acompanhar o progresso.</p></div>
          <div className="nl-inv-view-toggle" role="group" aria-label="Visualizar casos"><button type="button" className={mode==='board'?'active':''} aria-pressed={mode==='board'} onClick={()=>setMode('board')}>Kanban</button><button type="button" className={mode==='table'?'active':''} aria-pressed={mode==='table'} onClick={()=>setMode('table')}>Tabela</button></div>
        </div>
        <div className="nl-inv-case-filters"><label>Buscar caso<input type="search" placeholder="Conta, transação, descrição..." value={caseSearch} onChange={e=>setCaseSearch(e.target.value)}/></label>
          <label>Situação<select value={caseStatus} onChange={e=>setCaseStatus(e.target.value)}><option value="todos">Todas</option>{Object.entries(CASE_STATUSES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
        {mode==='board'?<div className="nl-inv-case-board">
          {Object.entries(CASE_STATUSES).map(([status,label])=><section key={status} className="nl-inv-board-column nl-inv-status-column" onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e,status)} aria-label={'Casos: '+label}>
            <h3>{label} <span>{cases.filter(c=>c.status===status).length}</span></h3>
            <div>{cases.filter(c=>c.status===status).map(record=><article draggable={!local.blocked} onDragStart={e=>e.dataTransfer.setData('text/plain',record.id)} key={record.id} className="nl-inv-board-card nl-inv-case-card">
              <button type="button" onClick={()=>setSelectedId(record.signalId)} className="nl-inv-card-open"><strong>{record.signal.titulo}</strong><small>{PATTERN_NAMES[record.signal.regra]}</small><span>{record.signal.quantidade_evidencias} evidências · {record.signal.nivel==='alto'?'Alta':'Média'}</span></button>
              <label>Situação<select disabled={local.blocked} value={record.status} onChange={e=>changeStatus(record.id,e.target.value)}>{Object.entries(CASE_STATUSES).map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>
            </article>)}</div>
          </section>)}
        </div>:<div className="nl-inv-table-wrap"><table className="nl-inv-table"><thead><tr><th>Caso</th><th>Prioridade</th><th>Situação</th><th>Atualizado em</th><th></th></tr></thead><tbody>{cases.map(c=><tr key={c.id}>
          <td><strong>{c.signal.titulo}</strong><small>{PATTERN_NAMES[c.signal.regra]}</small></td><td><span className={'nl-inv-priority nl-inv-priority--'+c.signal.nivel}>{c.signal.nivel==='alto'?'Alta':'Média'}</span></td>
          <td><select disabled={local.blocked} className="nl-inv-status-select" value={c.status} onChange={e=>changeStatus(c.id,e.target.value)} aria-label={'Situação de '+c.signal.titulo}>{Object.entries(CASE_STATUSES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td>
          <td>{stampDate(c.updatedAt)}</td><td><button type="button" onClick={()=>setSelectedId(c.signalId)}>Detalhes ↗</button></td></tr>)}</tbody></table></div>}
        {!cases.length&&<p className="nl-inv-empty">{local.cases.length?'Nenhum caso corresponde aos filtros.':'Nenhum caso aberto ainda. Use “Abrir caso” na lista de sinais IBM abaixo.'}</p>}
        <footer><span>Kanban: arraste os cartões ou altere a situação pelo seletor. Mudanças são locais.</span><button type="button" onClick={()=>{setCaseSearch('');setCaseStatus('todos');}}>Limpar filtros</button></footer>
      </div>
    </section>

    <section className="nl-inv-signal-section" aria-labelledby="nl-inv-queue-title">
      <div className="nl-inv-section-intro"><div><span className="nl-inv-kicker">TRIAGEM / SINAIS CALCULADOS</span><h2 id="nl-inv-queue-title">Sinais disponíveis</h2></div>
        <span className="nl-inv-local-pill">IBM AML-Data · USD</span></div>
      {loading&&<p role="status" className="nl-inv-state">Buscando padrões no recorte IBM...</p>}
      {error&&<p role="alert" className="nl-inv-state nl-inv-state--error">{error} <button type="button" onClick={()=>setReload(v=>v+1)}>Tentar novamente</button></p>}
      {!loading&&data?.disponivel&&<div className="nl-inv-panel">
        <div className="nl-inv-panel-head"><div><h2>Fila para revisão</h2><p>{data.transacoes_analisadas.toLocaleString('pt-BR')} transações analisadas{data.recorte_parcial?' · recorte parcial':''}. Nenhum caso é criado automaticamente.</p></div></div>
        <div className="nl-inv-filters"><label>Pesquisar<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Conta, sinal ou transação"/></label>
          <label>Prioridade<select value={severity} onChange={e=>setSeverity(e.target.value)}><option value="todos">Todas</option><option value="alto">Alta</option><option value="medio">Média</option></select></label>
          <label>Padrão<select value={pattern} onChange={e=>setPattern(e.target.value)}><option value="todos">Todos</option>{Object.entries(PATTERN_NAMES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        </div>
        <div className="nl-inv-table-wrap"><table className="nl-inv-table"><thead><tr><th>Padrão observado</th><th>Prioridade</th><th>Transações</th><th>Janela inicial</th><th></th></tr></thead><tbody>{queue.map(signal=>{
          const exists=local.cases.some(c=>c.signalId===signal.id);
          return <tr key={signal.id}><td><strong>{signal.titulo}</strong><small>{PATTERN_NAMES[signal.regra]}</small></td><td><span className={'nl-inv-priority nl-inv-priority--'+signal.nivel}>{signal.nivel==='alto'?'Alta':'Média'}</span></td><td>{signal.quantidade_evidencias}</td><td>{showDate(signal.inicio)}</td>
            <td><div className="nl-inv-row-actions"><button type="button" onClick={()=>setSelectedId(signal.id)}>Evidências</button><button type="button" disabled={local.blocked && !exists} onClick={()=>{if(!exists)create(signal);setSelectedId(signal.id);}}>{exists?'Ver caso':'Abrir caso'}</button></div></td></tr>;
        })}</tbody></table></div>
        {!queue.length&&<p className="nl-inv-empty">Nenhum padrão encontrado com os filtros selecionados.</p>}
        <footer>As regras são heurísticas e não identificam fraude comprovada. <button type="button" onClick={()=>{setSearch('');setSeverity('todos');setPattern('todos');}}>Limpar filtros</button></footer>
      </div>}
    </section>
    {selectedSignal&&<EvidenceDrawer key={selectedId} signal={selectedRecord?.signal??selectedSignal} record={selectedRecord} stale={!selectedLiveSignal} canWrite={!local.blocked}
      onCreate={create} onChangeStatus={changeStatus} onSaveNote={saveNote} onClose={()=>setSelectedId(null)} onNetwork={()=>{setSelectedId(null);onNavigate('network');}}/>}
  </main>;
}
