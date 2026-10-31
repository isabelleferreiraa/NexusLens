import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AIInsights from "../components/AIInsights/AIInsights";
import GraphView from "../components/GraphView/GraphView";
import "../styles/dashboard.css";

const PRIORIDADE = { Alto: 3, "Médio": 2, Medio: 2, Baixo: 1 };
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroDados, setErroDados] = useState("");
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErroDados("");
    try {
      const resposta = await api.get("/grafo");
      setDados(resposta.data);
    } catch {
      setErroDados("Não foi possível carregar a rede. Verifique a conexão e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const contas = useMemo(() => {
    const nos = dados?.nos ?? [];
    const transacoes = dados?.arestas ?? [];

    return nos.map((no) => {
      const relacionadas = transacoes.filter((transacao) =>
        String(transacao.origem) === String(no.id) ||
        String(transacao.destino) === String(no.id)
      );

      return {
        ...no,
        quantidadeTransacoes: relacionadas.length,
        volumeRelacionado: relacionadas.reduce(
          (total, transacao) => total + Number(transacao.valor ?? 0), 0
        ),
      };
    }).sort((a, b) =>
      (PRIORIDADE[b.risco] ?? 0) - (PRIORIDADE[a.risco] ?? 0) ||
      b.quantidadeTransacoes - a.quantidadeTransacoes
    );
  }, [dados]);

  const contasEmAtencao = contas.filter((conta) => conta.risco !== "Baixo").length;
  const contasFiltradas = contas.filter((conta) => {
    const correspondeBusca = conta.nome.toLocaleLowerCase("pt-BR").includes(
      busca.trim().toLocaleLowerCase("pt-BR")
    );
    return correspondeBusca && (filtro === "Todos" || conta.risco === filtro);
  });
  const contaSelecionada = contas.find((conta) => String(conta.id) === selecionadoId) ?? contas[0];

  async function gerarRelatorioIA() {
    if (!dados || carregandoIA) return;
    setCarregandoIA(true);
    setErroIA("");
    try {
      const resposta = await api.post("/relatorio", dados);
      if (typeof resposta.data?.relatorio !== "string" || !resposta.data.relatorio.trim()) {
        throw new Error("Relatório vazio");
      }
      setDados((anterior) => ({ ...anterior, relatorio: resposta.data.relatorio }));
    } catch {
      setErroIA("O parecer não pôde ser gerado agora. Tente novamente em instantes.");
    } finally {
      setCarregandoIA(false);
    }
  }

  return (
    <div className="nx-shell">
      <aside className="nx-sidebar" aria-label="Navegação principal">
        <a className="nx-brand" href="#visao-geral">
          <span className="nx-brand-mark" aria-hidden="true">◇</span>
          <span className="nx-brand-name">Nexus<span>Lens</span><small>FINANCIAL INTELLIGENCE</small></span>
        </a>
        <p className="nx-nav-label">WORKSPACE</p>
        <nav className="nx-nav">
          <a href="#visao-geral" className="nx-nav-link nx-nav-link--active"><span aria-hidden="true">▦</span> Visão geral</a>
          <a href="#rede" className="nx-nav-link"><span aria-hidden="true">◎</span> Rede financeira</a>
          <a href="#alertas" className="nx-nav-link"><span aria-hidden="true">◇</span> Triagem de contas</a>
          <a href="#investigacao" className="nx-nav-link"><span aria-hidden="true">▤</span> Detalhes</a>
          <a href="#inteligencia" className="nx-nav-link"><span aria-hidden="true">✦</span> Nexus AI</a>
        </nav>
        <div className="nx-side-info">
          <span className="nx-side-info-dot" aria-hidden="true" />
          <div><strong>Ambiente demonstrativo</strong><p>Dados sintéticos para exploração e testes.</p></div>
        </div>
      </aside>

      <div className="nx-content">
        <header className="nx-topbar">
          <span className="nx-topbar-breadcrumb">Workspace <span>/</span> Monitoramento de rede</span>
          <div className="nx-topbar-right">
            <span className={"nx-connection " + (erroDados ? "nx-connection--error" : "")}>
              <span aria-hidden="true" /> {erroDados ? "Falha na consulta" : carregando ? "Atualizando" : "API conectada"}
            </span>
            <span className="nx-user-avatar" title="Ambiente demonstrativo">NL</span>
          </div>
        </header>

        <main className="nx-main" id="visao-geral">
          <section className="nx-hero" aria-labelledby="nx-page-title">
            <div>
              <span className="nx-eyebrow">INTELIGÊNCIA DE RISCO · DEMONSTRAÇÃO</span>
              <h1 id="nx-page-title">Enxergue além das transações.</h1>
              <p>Explore conexões financeiras, identifique sinais que merecem revisão e investigue com apoio de IA.</p>
            </div>
            <button type="button" className="nx-refresh" onClick={carregarDados} disabled={carregando}>
              <span aria-hidden="true">↻</span> {carregando ? "Atualizando..." : "Atualizar análise"}
            </button>
          </section>

          {erroDados && <div className="nx-error" role="alert">{erroDados} <button onClick={carregarDados}>Tentar novamente</button></div>}
          {!dados && carregando && <div className="nx-state" role="status">Carregando dados da rede financeira...</div>}

          <section className="nx-stat-grid" aria-label="Indicadores gerais da rede">
            <div className="nx-stat">
              <span className="nx-stat-label">Score estimado da rede</span>
              <strong>{dados?.score_risco ?? "—"}<small>{dados ? " / 100" : ""}</small></strong>
              <span className="nx-stat-footer"><i className="nx-dot-indicator nx-dot-indicator--amber" /> {dados?.classificacao ?? "Aguardando dados"}</span>
            </div>
            <div className="nx-stat">
              <span className="nx-stat-label">Contas analisadas</span>
              <strong>{dados?.nos?.length ?? "—"}</strong>
              <span className="nx-stat-footer">Participantes da rede</span>
            </div>
            <div className="nx-stat">
              <span className="nx-stat-label">Transações mapeadas</span>
              <strong>{dados?.arestas?.length ?? "—"}</strong>
              <span className="nx-stat-footer">Conexões com valor associado</span>
            </div>
            <div className="nx-stat nx-stat--accent">
              <span className="nx-stat-label">Contas em atenção</span>
              <strong>{dados ? contasEmAtencao : "—"}</strong>
              <span className="nx-stat-footer">Classificação heurística média ou alta</span>
            </div>
          </section>

          <div className="nx-workspace">
            <section className="nx-panel nx-panel--network" id="rede" aria-labelledby="nx-network-title">
              <div className="nx-section-heading">
                <div><span className="nx-overline">EXPLORAÇÃO VISUAL</span><h2 id="nx-network-title">Mapa de conexões</h2></div>
                <span className="nx-help-text">Selecione um nó para investigar</span>
              </div>
              <GraphView
                nos={dados?.nos ?? []}
                arestas={dados?.arestas ?? []}
                selecionadoId={contaSelecionada ? String(contaSelecionada.id) : null}
                onSelecionarNo={setSelecionadoId}
              />
            </section>

            <section className="nx-panel nx-panel--queue" id="alertas" aria-labelledby="nx-queue-title">
              <div className="nx-section-heading">
                <div><span className="nx-overline">PRIORIDADE DE REVISÃO</span><h2 id="nx-queue-title">Triagem de contas</h2></div>
                <span className="nx-count">{contasFiltradas.length}</span>
              </div>
              <p className="nx-section-sub">Ordenação por nível de risco da rede e quantidade de transações relacionadas.</p>
              <div className="nx-queue-filters">
                <input
                  type="search"
                  aria-label="Buscar conta por nome"
                  placeholder="Buscar conta..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                />
                <select aria-label="Filtrar por risco" value={filtro} onChange={(event) => setFiltro(event.target.value)}>
                  <option>Todos</option><option>Alto</option><option>Médio</option><option>Baixo</option>
                </select>
              </div>
              <div className="nx-queue-list">
                {contasFiltradas.length ? contasFiltradas.map((conta) => (
                  <button
                    type="button"
                    key={conta.id}
                    className={"nx-queue-row " + (contaSelecionada?.id === conta.id ? "nx-queue-row--selected" : "")}
                    aria-pressed={contaSelecionada?.id === conta.id}
                    onClick={() => setSelecionadoId(String(conta.id))}
                  >
                    <span className="nx-queue-avatar" aria-hidden="true">{conta.nome?.slice(0, 1)?.toUpperCase()}</span>
                    <span className="nx-queue-person"><strong>{conta.nome}</strong><small>{conta.quantidadeTransacoes} transações relacionadas</small></span>
                    <span className={"nx-risk nx-risk--" + (conta.risco === "Alto" ? "high" : conta.risco === "Médio" ? "medium" : "low")}>{conta.risco}</span>
                  </button>
                )) : <p className="nx-queue-empty">Nenhuma conta encontrada com esses filtros.</p>}
              </div>
            </section>
          </div>

          <div className="nx-bottom-grid">
            <section className="nx-panel nx-panel--details" id="investigacao" aria-labelledby="nx-details-title">
              <div className="nx-section-heading">
                <div><span className="nx-overline">CONTEXTO DA REDE</span><h2 id="nx-details-title">Detalhes da conta</h2></div>
                {contaSelecionada && <span className={"nx-risk nx-risk--" + (contaSelecionada.risco === "Alto" ? "high" : contaSelecionada.risco === "Médio" ? "medium" : "low")}>{contaSelecionada.risco}</span>}
              </div>
              {contaSelecionada ? (
                <>
                  <div className="nx-person-name">{contaSelecionada.nome}<small>ID: {String(contaSelecionada.id).slice(0, 8)}…</small></div>
                  <div className="nx-detail-metrics">
                    <div><span>Transações relacionadas</span><strong>{contaSelecionada.quantidadeTransacoes}</strong></div>
                    <div><span>Volume relacionado*</span><strong>{moeda.format(contaSelecionada.volumeRelacionado)}</strong></div>
                  </div>
                  <p className="nx-legal-note">* Soma das transações de entrada e saída relacionadas à conta, sem deduplicação de fluxos. Centralidade na rede não comprova fraude.</p>
                </>
              ) : <p className="nx-section-sub">Selecione uma conta para explorar os detalhes.</p>}
            </section>

            <section className="nx-ai-wrapper" id="inteligencia">
              <AIInsights
                relatorio={dados?.relatorio}
                onGerar={gerarRelatorioIA}
                carregando={carregandoIA}
                bloqueado={!dados}
                erro={erroIA}
              />
              <p className="nx-ai-disclaimer">A IA auxilia na interpretação das métricas. Toda conclusão exige validação humana.</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
