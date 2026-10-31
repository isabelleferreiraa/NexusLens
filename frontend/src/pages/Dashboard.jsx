import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';
import AIInsights from '../components/AIInsights/AIInsights';
import StatCard from '../components/StatCard/StatCard';
import GraphView from '../components/GraphView/GraphView';
import MetricsPanel from '../components/MetricsPanel/MetricsPanel';

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroDados, setErroDados] = useState(false);
  const [carregandoIA, setCarregandoIA] = useState(false);

  useEffect(() => {
    let ativo = true;
    api.get('/grafo')
      .then((resposta) => { if (ativo) setDados(resposta.data); })
      .catch((erro) => { if (ativo) { console.error('Erro ao buscar dados:', erro); setErroDados(true); } })
      .finally(() => { if (ativo) setCarregandoDados(false); });
    return () => { ativo = false; };
  }, []);

  async function gerarRelatorioIA() {
    if (!dados || carregandoIA) return;
    setCarregandoIA(true);
    try {
      const resposta = await api.post('/relatorio', dados);
      setDados((anterior) => ({ ...anterior, relatorio: resposta.data.relatorio }));
    } catch (erro) {
      console.error('Erro ao gerar relatório:', erro);
      setDados((anterior) => ({ ...anterior, relatorio: 'Não foi possível gerar o relatório da IA no momento.' }));
    } finally {
      setCarregandoIA(false);
    }
  }

  return (
    <main className="nexuslens-main" aria-labelledby="nl-dashboard-title">
      <div className="nl-dashboard-heading">
        <div>
          <span className="nl-dashboard-eyebrow">MONITORAMENTO / DEMONSTRAÇÃO</span>
          <h1 id="nl-dashboard-title">VISÃO GERAL</h1>
          <p>Indicadores e conexões de uma rede financeira demonstrativa.</p>
        </div>
        <span className="nl-dashboard-mode">Dados sintéticos</span>
      </div>
      {carregandoDados && <p className="nl-dash-status" role="status">Carregando dados da rede financeira...</p>}
      {erroDados && <p className="nl-dash-status nl-dash-status--error" role="alert">Não foi possível consultar a API. O endereço de prévia pode precisar de autorização no backend.</p>}
      <section className="stat-cards-row" aria-label="Indicadores da rede">
        <StatCard icon="◎" label="Contas analisadas" value={dados?.nos?.length} description="Participantes da rede" color="blue"/>
        <StatCard icon="⇄" label="Transações mapeadas" value={dados?.arestas?.length} description="Conexões da rede" color="blue"/>
        <StatCard icon="◈" label="Score da rede" value={dados?.score_risco} description="Pontuação heurística / 100" color="yellow"/>
        <StatCard icon="◇" label="Classificação" value={dados?.classificacao} description="Não representa confirmação de fraude" color="blue"/>
      </section>
      <div className="nl-dashboard-grid">
        <section className="graph-section"><GraphView nos={dados?.nos ?? []} arestas={dados?.arestas ?? []}/></section>
        <section className="metrics-section"><MetricsPanel dados={dados}/></section>
      </div>
      <section className="nl-dashboard-ai" aria-label="Relatórios com inteligência artificial">
        {dados ? <AIInsights relatorio={dados.relatorio} onGerar={gerarRelatorioIA} carregando={carregandoIA}/> :
          <p className="nl-dash-status">O relatório com IA estará disponível quando os dados da rede forem carregados.</p>}
        <p className="nl-dashboard-ai-note">O parecer gerado é exploratório e deve ser revisado por uma pessoa. O score não é uma probabilidade de fraude.</p>
      </section>
    </main>
  );
}

export default Dashboard;
