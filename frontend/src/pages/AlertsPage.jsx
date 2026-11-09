import { useMemo, useState } from 'react';
import useGrafo from '../hooks/useGrafo';
import DatasetNotice from '../components/layout/DatasetNotice';
import { criarSinaisEstruturais, filtrarSinais, resumirSinais } from '../utils/alerts';
import AlertDetailsDrawer from '../components/alerts/AlertDetailsDrawer';
import '../styles/alerts.css';

export default function AlertsPage({ onNavigate }) {
  const { dados, carregando, erro, indisponivel, situacao, recarregar } = useGrafo();
  const [busca, setBusca] = useState('');
  const [nivel, setNivel] = useState('todos');
  const [ordem, setOrdem] = useState('prioridade');
  const [selecionadoId, setSelecionadoId] = useState(null);

  const sinais = useMemo(() => criarSinaisEstruturais(dados), [dados]);
  const resumo = useMemo(() => resumirSinais(sinais), [sinais]);
  const filtrados = useMemo(() => filtrarSinais(sinais, { busca, nivel, ordem }), [sinais, busca, nivel, ordem]);
  const selecionado = sinais.find((s) => s.id === selecionadoId) ?? null;

  return <main className="nl-alerts" aria-labelledby="nl-alerts-title">
    <div className="nl-alerts-heading">
      <div><span className="nl-alerts-overline">MONITORAMENTO / SINAIS ESTRUTURAIS</span><h1 id="nl-alerts-title">CENTRAL DE ALERTAS</h1>
        <p>Explore contas classificadas para revisão a partir das métricas da rede financeira.</p></div>
      <button type="button" className="nl-alerts-refresh" onClick={recarregar} disabled={carregando}>↻ {carregando ? 'Atualizando...' : 'Atualizar análise'}</button>
    </div>

    <DatasetNotice unavailable={indisponivel} status={situacao}/>
    <div className="nl-alerts-context"><span className="nl-alerts-context-icon" aria-hidden="true">ⓘ</span><p><strong>Triagem exploratória.</strong> A API ainda não fornece eventos de alerta independentes. Esta lista mostra contas com classificação <strong>alta ou média</strong> no grafo, sem afirmar que houve fraude.</p></div>
    {carregando && <p className="nl-alerts-notice" role="status">Carregando classificações da API...</p>}
    {erro && <p className="nl-alerts-notice nl-alerts-notice--error" role="alert">{erro} <button type="button" onClick={recarregar}>Tentar novamente</button></p>}

    <section className="nl-alerts-stats" aria-label="Resumo de sinais estruturais">
      <article><span>Contas para revisão</span><strong>{dados ? resumo.total : '—'}</strong><small>Classificação média ou alta</small><i aria-hidden="true">◎</i></article>
      <article><span>Classificação alta</span><strong>{dados ? resumo.altos : '—'}</strong><small>Maior prioridade de análise</small><i aria-hidden="true">◈</i></article>
      <article><span>Classificação média</span><strong>{dados ? resumo.medios : '—'}</strong><small>Acompanhar conexões</small><i aria-hidden="true">◇</i></article>
    </section>

    <section className="nl-alerts-panel" aria-labelledby="nl-alerts-table-title">
      <div className="nl-alerts-panel-heading"><div><span className="nl-alerts-overline">TRIAGEM DA REDE</span><h2 id="nl-alerts-table-title">Fila de sinais</h2><p>Selecione uma conta para entender sua classificação e seus relacionamentos.</p></div><span className="nl-alerts-count">{dados ? `${filtrados.length} de ${sinais.length}` : '—'} contas</span></div>
      <div className="nl-alerts-filters">
        <label className="nl-alerts-field nl-alerts-field--search">Buscar conta ou identificador<input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite um nome ou ID" /></label>
        <label className="nl-alerts-field">Classificação<select value={nivel} onChange={(e) => setNivel(e.target.value)}><option value="todos">Todas</option><option value="alto">Risco alto</option><option value="medio">Risco médio</option></select></label>
        <label className="nl-alerts-field">Ordenar por<select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="prioridade">Prioridade</option><option value="conexoes">Mais conexões</option><option value="transacoes">Mais transações</option><option value="nome">Nome</option></select></label>
      </div>
      <div className="nl-alerts-table-scroll"><table className="nl-alerts-table">
        <thead><tr><th>Conta analisada</th><th>Classificação</th><th>Conexões</th><th>Transações</th><th><span className="sr-only">Detalhes</span></th></tr></thead>
        <tbody>{!erro && filtrados.map((sinal) => <tr key={sinal.id}>
          <td><div className="nl-alerts-account"><span className="nl-alerts-account-icon" aria-hidden="true">{sinal.nome.charAt(0).toLocaleUpperCase('pt-BR')}</span><span><strong>{sinal.nome}</strong><small title={sinal.id}>{sinal.id}</small></span></div></td>
          <td><span className={'nl-alerts-level nl-alerts-level--' + sinal.nivel}><span aria-hidden="true" />{sinal.nivel === 'alto' ? 'Alto' : 'Médio'}</span></td>
          <td>{sinal.grau}</td><td>{sinal.transacoes}</td>
          <td><button type="button" className="nl-alerts-details" onClick={() => setSelecionadoId(sinal.id)} aria-label={'Ver detalhes da conta ' + sinal.nome}>Ver detalhes <span aria-hidden="true">↗</span></button></td>
        </tr>)}</tbody>
      </table></div>
      {!carregando && !erro && filtrados.length === 0 && <div className="nl-alerts-empty"><strong>Nenhum sinal encontrado</strong><p>{sinais.length ? 'Tente ajustar a pesquisa ou os filtros.' : 'Nenhuma conta classificada como risco médio ou alto neste conjunto de dados.'}</p></div>}
      <footer className="nl-alerts-panel-footer"><span>Classificações retornadas por <code>/datasets/ibm-aml/grafo</code> · dados sintéticos</span><button type="button" onClick={() => { setBusca(''); setNivel('todos'); setOrdem('prioridade'); }}>Limpar filtros</button></footer>
    </section>
    {selecionado && <AlertDetailsDrawer currency="USD" sinal={selecionado} onClose={() => setSelecionadoId(null)} onNetwork={() => { setSelecionadoId(null); onNavigate('network'); }} />}
  </main>;
}
