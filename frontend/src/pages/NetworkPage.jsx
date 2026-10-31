import useGrafo from '../hooks/useGrafo';
import GraphView from '../components/GraphView/GraphView';
import MetricsPanel from '../components/MetricsPanel/MetricsPanel';
import '../styles/feature-pages.css';

export default function NetworkPage() {
  const { dados, carregando, erro, recarregar } = useGrafo();
  return (
    <main className="nl-feature-page" aria-labelledby="network-title">
      <div className="nl-feature-heading">
        <div><span className="nl-feature-eyebrow">EXPLORAÇÃO DA REDE</span>
          <h1 id="network-title">REDE FINANCEIRA</h1>
          <p>Explore as relações entre contas e as métricas calculadas pelo NetworkX.</p></div>
        <button type="button" onClick={recarregar} disabled={carregando} className="nl-action-button">Atualizar rede</button>
      </div>
      {carregando && <p className="nl-feature-state" role="status">Carregando grafo...</p>}
      {erro && <p className="nl-feature-state nl-feature-state--error" role="alert">{erro}</p>}
      {dados && (
        <div className="nl-feature-network">
          <GraphView nos={dados.nos} arestas={dados.arestas}/>
          <MetricsPanel dados={dados}/>
        </div>
      )}
      <p className="nl-feature-note">As classificações são heurísticas. Ter conexões financeiras não comprova irregularidade.</p>
    </main>
  );
}
