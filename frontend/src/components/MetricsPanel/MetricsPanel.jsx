import './MetricsPanel.css';

function MetricsPanel({ dados }) {
  return (
    <div className="nx-metrics-panel">
      <div className="section-header">
        <h2>Indicadores de Rede</h2>
        <span className="section-badge">Métricas</span>
      </div>

      <div className="nx-metrics-grid">
        
        {/* Recomendação ocupando linha inteira em destaque */}
        <div className="nx-metric-card nx-metric-card--full nx-metric-card--highlight">
          <div className="nx-metric-card__header">
            <span className="nx-metric-card__icon">🛡️</span>
            <h4>Recomendação do Sistema</h4>
          </div>
          <p className="nx-metric-card__value-text">
            {dados?.recomendacao ?? "Aguardando processamento..."}
          </p>
        </div>

        {/* Métricas individuais */}
        <div className="nx-metric-card">
          <div className="nx-metric-card__header">
            <span className="nx-metric-card__icon">🎯</span>
            <h4>Influência</h4>
          </div>
          <p className="nx-metric-card__value">
            {dados?.metricas?.nivel_influencia ?? "--"}
          </p>
        </div>

        <div className="nx-metric-card">
          <div className="nx-metric-card__header">
            <span className="nx-metric-card__icon">🔗</span>
            <h4>Conexões Ativas</h4>
          </div>
          <p className="nx-metric-card__value">
            {dados?.metricas?.quantidade_conexoes ?? "--"}
          </p>
        </div>

        <div className="nx-metric-card nx-metric-card--full">
          <div className="nx-metric-card__header">
            <span className="nx-metric-card__icon">🎭</span>
            <h4>Papel na Rede</h4>
          </div>
          <p className="nx-metric-card__value-text">
            {dados?.metricas?.papel_na_rede ?? "--"}
          </p>
        </div>

      </div>
    </div>
  );
}

export default MetricsPanel;
