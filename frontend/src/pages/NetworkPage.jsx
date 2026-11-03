import useGrafo from '../hooks/useGrafo';
import GraphView from '../components/GraphView/GraphView';
import MetricsPanel from '../components/MetricsPanel/MetricsPanel';
import '../styles/feature-pages.css';
import '../styles/network-page.css';

export default function NetworkPage() {
  const {dados,carregando,erro,recarregar}=useGrafo();
  return (
    <main className="nl-feature-page nl-feature-page--network" aria-labelledby="network-title">
      <div className="nl-feature-heading">
        <div><span className="nl-feature-eyebrow">INTELIGÊNCIA DE CONEXÕES</span>
          <h1 id="network-title">REDE FINANCEIRA</h1>
          <p>Entenda como as contas se relacionam em um mapa interativo e explore as métricas estruturais.</p></div>
        <button type="button" onClick={recarregar} disabled={carregando} className="nl-action-button">
          {carregando?'Atualizando...':'↻ Atualizar rede'}</button>
      </div>
      {carregando&&<p className="nl-feature-state" role="status">Carregando dados da rede financeira...</p>}
      {erro&&<p className="nl-feature-state nl-feature-state--error" role="alert">{erro} <button type="button" onClick={recarregar}>Tentar novamente</button></p>}
      {dados&&<>
        <div className="nl-network-summary" aria-label="Resumo da rede">
          <div><span>CONTAS NA REDE</span><strong>{dados.nos.length}</strong><small>Participantes analisados</small></div>
          <div><span>TRANSAÇÕES</span><strong>{dados.arestas.length}</strong><small>Conexões registradas</small></div>
          <div><span>SCORE ESTRUTURAL</span><strong>{typeof dados.score_risco==='number'?dados.score_risco:'—'}<small>{typeof dados.score_risco==='number'?'/100':''}</small></strong><small>Avaliação heurística</small></div>
        </div>
        <div className="nl-feature-network"><GraphView nos={dados.nos} arestas={dados.arestas}/></div>
        <section className="nl-feature-metrics" aria-label="Indicadores estruturais da rede">
          <div className="nl-feature-metrics-heading"><span className="nl-feature-eyebrow">LEITURA TÉCNICA</span><h2>Métricas da rede</h2></div>
          <MetricsPanel dados={dados}/>
        </section>
      </>}
      <p className="nl-feature-note">As classificações são heurísticas, baseadas na estrutura da rede. Conexões financeiras não comprovam irregularidade.</p>
    </main>
  );
}
