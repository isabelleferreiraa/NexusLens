import "./AIInsights.css";

function AIInsights({ relatorio, onGerar, carregando, bloqueado = false, erro = "" }) {
  return (
    <section className="nx-ai-insights" aria-labelledby="nx-ai-title">
      <div className="nx-ai-insights__header">
        <div className="nx-ai-insights__title-wrap">
          <div className="nx-ai-insights__icon" aria-hidden="true">✦</div>
          <h2 id="nx-ai-title" className="nx-ai-insights__title">Nexus AI · Parecer da rede</h2>
        </div>
        <button
          type="button"
          className="nx-ai-insights__btn"
          onClick={onGerar}
          disabled={carregando || bloqueado}
        >
          {carregando ? (
            <span className="nx-ai-insights__loading">
              <svg className="nx-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 30" strokeLinecap="round" />
              </svg>
              Gerando parecer...
            </span>
          ) : "Gerar parecer"}
        </button>
      </div>
      {erro && <p className="nx-ai-error" role="alert">{erro}</p>}
      <div className="nx-ai-insights__content" aria-live="polite">
        {relatorio ? (
          <div className="nx-ai-insights__text">
            {relatorio.split("\n").filter(Boolean).map((paragrafo, index) => (
              <p key={index}>{paragrafo}</p>
            ))}
          </div>
        ) : (
          <div className="nx-ai-insights__empty">
            <span className="nx-ai-insights__empty-icon" aria-hidden="true">✧</span>
            <p className="nx-ai-insights__empty-text">
              O Gemini pode resumir as métricas da rede em linguagem natural. Confira os dados e gere um parecer quando desejar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AIInsights;
