import useGrafo from '../hooks/useGrafo';
import { getOverview } from '../utils/overview';
import '../styles/dashboard.css';

const grupos = [
  { key: 'alto', label: 'Alto', className: 'high' },
  { key: 'medio', label: 'Médio', className: 'medium' },
  { key: 'baixo', label: 'Baixo', className: 'low' },
  { key: 'outros', label: 'Sem classificação', className: 'unknown' },
];

function Stat({ label, value, hint, icon }) {
  return <article className="nl-overview-stat">
    <div className="nl-overview-stat-heading"><span>{label}</span><span className="nl-overview-stat-icon" aria-hidden="true">{icon}</span></div>
    <strong>{value}</strong><small>{hint}</small>
  </article>;
}

export default function Dashboard({ onNavigate }) {
  const { dados, carregando, erro, recarregar } = useGrafo();
  const info = getOverview(dados);
  const totalClassificados = info.distribuicao.alto + info.distribuicao.medio + info.distribuicao.baixo + info.distribuicao.outros;

  return (
    <main className="nexuslens-main" aria-labelledby="nl-dashboard-title">
      <section className="nl-overview-heading">
        <div><span className="nl-overview-eyebrow">MONITORAMENTO FINANCEIRO · DEMONSTRAÇÃO</span>
          <h1 id="nl-dashboard-title">VISÃO GERAL DE RISCO</h1>
          <p>Um panorama da rede e das contas que merecem uma revisão mais detalhada.</p></div>
        <button type="button" className="nl-overview-refresh" disabled={carregando} onClick={recarregar}><span aria-hidden="true">↻</span> {carregando ? 'Atualizando...' : 'Atualizar dados'}</button>
      </section>

      {carregando && <div className="nl-overview-notice" role="status">Carregando métricas do backend...</div>}
      {erro && <div className="nl-overview-notice nl-overview-notice--error" role="alert">{erro} <button type="button" onClick={recarregar}>Tentar novamente</button></div>}

      <section className="nl-overview-stats" aria-label="Resumo da rede financeira">
        <Stat label="Transações mapeadas" value={dados ? info.transacoes.toLocaleString('pt-BR') : '—'} hint="Conexões financeiras" icon="⇄" />
        <Stat label="Contas analisadas" value={dados ? info.contas.toLocaleString('pt-BR') : '—'} hint="Participantes da rede" icon="◎" />
        <Stat label="Score estrutural" value={info.score ?? '—'} hint="Escala heurística de 0 a 100" icon="◉" />
        <Stat label="Contas para revisão" value={dados ? info.revisao : '—'} hint="Classificação média ou alta" icon="◇" />
      </section>

      <section className="nl-overview-analytics" aria-label="Análise estrutural">
        <article className="nl-overview-panel nl-overview-panel--score">
          <div className="nl-panel-head"><div><span className="nl-panel-kicker">VISÃO ESTRUTURAL</span><h2>Score da rede</h2></div><span className="nl-panel-caption">Heurística</span></div>
          <div className="nl-score-content">
            <div className="nl-score-ring" role="img" aria-label={info.score === null ? 'Score indisponível' : `Score ${info.score} de 100`} style={{ '--score': `${(info.score ?? 0) * 3.6}deg` }}>
              <div className="nl-score-ring-center"><strong>{info.score ?? '—'}</strong><small>de 100</small></div>
            </div>
            <div className="nl-score-detail">
              <span className="nl-score-detail-label">CLASSIFICAÇÃO GERAL</span>
              <strong>{dados ? info.classificacao : 'Aguardando'}</strong>
              <p>{dados?.recomendacao ?? 'Os resultados aparecerão após o carregamento dos dados.'}</p>
              <button type="button" onClick={() => onNavigate('network')}>Explorar conexões <span aria-hidden="true">↗</span></button>
            </div>
          </div>
          <p className="nl-panel-footnote">O score descreve características da rede. Não representa probabilidade de fraude.</p>
        </article>
        <article className="nl-overview-panel">
          <div className="nl-panel-head"><div><span className="nl-panel-kicker">PERFIL DA REDE</span><h2>Distribuição por classificação</h2></div><span className="nl-panel-caption">{dados ? info.contas : '—'} contas</span></div>
          <p className="nl-panel-intro">Quantidade de contas por classificação informada pelo backend.</p>
          <div className="nl-risk-bars">
            {grupos.map(({ key, label, className }) => (
              <div className="nl-risk-bar-item" key={key}>
                <div className="nl-risk-bar-label"><span className={'nl-risk-dot nl-risk-dot--' + className} aria-hidden="true"/>{label}<strong>{dados ? info.distribuicao[key] : '—'}</strong></div>
                <div className="nl-risk-bar-track"><span className={'nl-risk-bar-fill nl-risk-bar-fill--' + className} style={{ width: `${totalClassificados ? (info.distribuicao[key] / totalClassificados) * 100 : 0}%` }}/></div>
              </div>
            ))}
          </div>
          <div className="nl-panel-tip">Para mostrar tendências ao longo do tempo, será necessário importar transações com datas e horários.</div>
        </article>
      </section>

      <section className="nl-overview-panel nl-overview-table-panel" aria-labelledby="nl-review-title">
        <div className="nl-panel-head"><div><span className="nl-panel-kicker">TRIAGEM EXPLORATÓRIA</span><h2 id="nl-review-title">Contas para revisão</h2></div>
          <button type="button" className="nl-table-top-action" onClick={() => onNavigate('network')}>Abrir rede financeira ↗</button></div>
        <p className="nl-panel-intro">Contas com classificação média ou alta, priorizadas pelo número de conexões.</p>
        {dados && info.contasRevisao.length > 0 ? (
          <div className="nl-table-wrap"><table className="nl-review-table">
            <thead><tr><th>Conta</th><th>Transações relacionadas</th><th>Classificação</th><th><span className="sr-only">Ação</span></th></tr></thead>
            <tbody>{info.contasRevisao.slice(0, 6).map((conta) => <tr key={String(conta.id)}>
              <td><span className="nl-account-cell"><span className="nl-account-avatar" aria-hidden="true">{conta.nome.slice(0, 1).toUpperCase()}</span><span><strong>{conta.nome}</strong><small>Conta #{conta.id}</small></span></span></td>
              <td>{conta.transacoes}</td>
              <td><span className={'nl-risk-label nl-risk-label--' + conta.categoria}>{conta.categoria === 'alto' ? 'Alto' : 'Médio'}</span></td>
              <td><button type="button" className="nl-row-action" onClick={() => onNavigate('network')}>Ver grafo <span aria-hidden="true">↗</span></button></td>
            </tr>)}</tbody>
          </table></div>
        ) : <div className="nl-overview-empty">{carregando ? 'Carregando contas...' : erro ? 'Dados indisponíveis.' : 'Nenhuma conta classificada para revisão neste conjunto.'}</div>}
      </section>
      <div className="nl-overview-bottom-note"><span>◈</span> Os dados usados neste ambiente são demonstrativos. Sinais estruturais exigem validação humana.</div>
    </main>
  );
}
