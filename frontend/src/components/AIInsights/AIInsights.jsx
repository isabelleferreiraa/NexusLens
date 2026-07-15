import './AIInsights.css';

function AIInsights({ relatorio, onGerar, carregando }) {
  return (
    <section className="nx-ai-insights">
      <div className="nx-ai-insights__header">
        <div className="nx-ai-insights__title-wrap">
          <div className="nx-ai-insights__icon" aria-hidden="true">✨</div>
          <h2 className="nx-ai-insights__title">Insights Gerados por IA</h2>
        </div>
        <button 
          className="nx-ai-insights__btn"
          onClick={onGerar}
          disabled={carregando}
        >
          {carregando ? (
            <span className="nx-ai-insights__loading">
              <svg className="nx-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 30" strokeLinecap="round" />
              </svg>
              Analisando...
            </span>
          ) : (
            <>
              <span className="nx-ai-insights__btn-icon">🧠</span>
              Gerar Nova Análise
            </>
          )}
        </button>
      </div>

      <div className="nx-ai-insights__content">
        {relatorio ? (
          <div className="nx-ai-insights__text">
            {relatorio.split('\n').map((paragrafo, index) => (
              <p key={index}>{paragrafo}</p>
            ))}
          </div>
        ) : (
          <div className="nx-ai-insights__empty">
            <div className="nx-ai-insights__empty-icon">🤖</div>
            <p className="nx-ai-insights__empty-text">
              Nenhuma análise gerada. Clique no botão acima para acionar o motor de Inteligência Artificial e investigar padrões nesta rede financeira.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AIInsights;
