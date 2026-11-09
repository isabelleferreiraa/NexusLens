import { useEffect, useMemo, useState } from 'react';
import { REPORTS_KEY, readReportHistory, removeReportHistory, printableReportHtml } from '../utils/reportHistory';
import '../styles/reports.css';

function getStorage() {
  try { return window.localStorage; } catch { return null; }
}
const date = value => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const norm = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');

export default function ReportsPage({ onNavigate }) {
  const [history, setHistory] = useState(() => readReportHistory(getStorage()));
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    function onStorage(event) { if (event.key === REPORTS_KEY) setHistory(readReportHistory(getStorage())); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filtered = useMemo(() => history.filter(r =>
    !query.trim() || [r.relatorio, r.classificacao, date(r.criado_em)]
      .some(value => norm(value).includes(norm(query.trim())))), [history, query]);
  // A visualização acompanha a pesquisa: não mostrar um relatório oculto pelo filtro.
  const selected = filtered.find(r => r.id === selectedId) ?? filtered[0] ?? null;

  function removeSelected() {
    if (!selected || !window.confirm('Excluir este parecer do histórico deste navegador?')) return;
    const result = removeReportHistory(getStorage(), selected.id);
    if (!result.ok) { setNotice('Não foi possível excluir o parecer deste navegador.'); return; }
    setHistory(result.records);
    setSelectedId(null);
    setNotice('Parecer excluído somente deste navegador.');
  }

  function printSelected() {
    if (!selected) return;
    const html = printableReportHtml(selected);
    if (!html) { setNotice('Não foi possível preparar a impressão.'); return; }
    const tab = window.open('', '_blank');
    if (!tab) { setNotice('O navegador bloqueou a nova aba. Habilite pop-ups para salvar o PDF.'); return; }
    tab.opener = null;
    tab.document.open();
    tab.document.write(html);
    tab.document.close();
    const printBtn = tab.document.querySelector('#nl-print-button');
    printBtn?.addEventListener('click', () => tab.print());
    tab.focus();
    // The destination can be set to "Salvar como PDF" in the browser print dialog.
    setNotice('A versão para impressão foi aberta. Use "Imprimir / Salvar como PDF" na nova aba.');
  }

  return <main className="nl-reports" aria-labelledby="nl-reports-title">
    <header className="nl-reports-header">
      <div><span className="nl-reports-kicker">ANÁLISE ASSISTIDA · IBM AML-DATA</span>
        <h1 id="nl-reports-title">RELATÓRIOS</h1>
        <p>Consulte os pareceres do Nexus AI e prepare documentos para impressão.</p></div>
      <button type="button" className="nl-reports-primary" onClick={() => onNavigate('ai')}>+ Gerar novo parecer</button>
    </header>
    <div className="nl-reports-context"><strong>Histórico demonstrativo neste navegador.</strong> Os relatórios ficam armazenados localmente, sem sincronização entre dispositivos ou usuários. Não armazene dados sensíveis. Cada parecer utiliza somente as métricas agregadas de um recorte sintético da IBM.</div>
    {notice && <p className="nl-reports-notice" role="status">{notice} <button type="button" onClick={() => setNotice('')}>Fechar</button></p>}
    <section className="nl-reports-summary" aria-label="Resumo do histórico">
      <article><span>PARECERES SALVOS</span><strong>{history.length}</strong><small>Neste navegador · limite de 30</small></article>
      <article><span>BASE DE ANÁLISE</span><strong className="nl-reports-summary-name">IBM AML-Data</strong><small>HI-Small · Dados sintéticos</small></article>
      <article><span>EXPORTAÇÃO</span><strong className="nl-reports-summary-name">PDF</strong><small>Por meio da impressão do navegador</small></article>
    </section>
    <section className="nl-reports-workspace" aria-label="Histórico e visualização de relatórios">
      <div className="nl-reports-list">
        <div className="nl-reports-panel-title"><span className="nl-reports-kicker">PARECERES GERADOS</span><h2>Histórico</h2></div>
        <label className="nl-reports-search">Pesquisar parecer<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Texto, classificação ou data" /></label>
        <div className="nl-reports-items">
          {filtered.map(report => <button type="button" key={report.id} className={'nl-reports-item' + (selected?.id===report.id?' nl-reports-item--active':'')} onClick={()=>{setSelectedId(report.id);setNotice('');}} aria-pressed={selected?.id===report.id}>
            <span className="nl-reports-item-top"><strong>Parecer estrutural IBM</strong><span>↗</span></span>
            <small>{date(report.criado_em)} · Score {report.score_risco}/100</small>
            <span className="nl-reports-item-bottom"><span className="nl-reports-pill">{report.classificacao}</span><span>{report.contas} contas</span></span>
          </button>)}
          {history.length===0 && <div className="nl-reports-list-empty">Ainda não existem pareceres salvos. Gere um relatório na página Nexus AI.</div>}
          {history.length>0 && filtered.length===0 && <p className="nl-reports-list-empty">Nenhum resultado para a pesquisa.</p>}
        </div>
      </div>
      <div className="nl-reports-viewer">
        {selected ? <>
          <div className="nl-reports-viewer-heading"><div><span className="nl-reports-kicker">PARECER SELECIONADO</span><h2>Relatório de análise estrutural</h2><p>{date(selected.criado_em)} · IBM AML-Data HI-Small</p></div></div>
          <div className="nl-reports-controls"><button type="button" className="nl-reports-primary" onClick={printSelected}>Imprimir / Salvar em PDF</button><button type="button" className="nl-reports-delete" onClick={removeSelected}>Excluir deste navegador</button></div>
          <div className="nl-reports-metrics"><div><small>Score</small><strong>{selected.score_risco}/100</strong></div><div><small>Classificação</small><strong>{selected.classificacao}</strong></div><div><small>Contas</small><strong>{selected.contas}</strong></div><div><small>Relações</small><strong>{selected.relacoes}</strong></div></div>
          <div className="nl-reports-text">{selected.relatorio.split(/\r?\n/).filter(x=>x.trim()).map((part,i)=><p key={i}>{part}</p>)}</div>
          <p className="nl-reports-footnote">Relatório gerado pelo Gemini a partir de métricas agregadas. Não é prova de irregularidade e requer revisão humana.</p>
        </> : <div className="nl-reports-empty"><span aria-hidden="true">◇</span><h2>Seu histórico começa aqui</h2><p>Gere um parecer no Nexus AI. Se for salvo com sucesso, ele aparecerá nesta página.</p><button type="button" onClick={()=>onNavigate('ai')}>Ir para Nexus AI</button></div>}
      </div>
    </section>
  </main>;
}
