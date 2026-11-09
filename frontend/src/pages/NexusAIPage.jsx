import { useState } from 'react';
import useGrafo from '../hooks/useGrafo';
import api from '../services/api';
import DatasetNotice from '../components/layout/DatasetNotice';
import { ibmReportPayload } from '../utils/reports';
import AIInsights from '../components/AIInsights/AIInsights';
import '../styles/feature-pages.css';

export default function NexusAIPage() {
  const { dados, setDados, carregando, erro, indisponivel, situacao, recarregar } = useGrafo();
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');

  async function gerarRelatorio() {
    if (carregandoIA) return;
    const payload = ibmReportPayload(dados);
    if (!payload) {
      setErroIA('As métricas da IBM estão incompletas; atualize a rede antes de gerar o relatório.');
      return;
    }
    setCarregandoIA(true);
    setErroIA('');
    try {
      // Gemini's only responsibility is to turn IBM-network metrics into a written report.
      // The backend does not receive simulator laundering labels.
      const resposta = await api.post('/relatorio', payload);
      const relatorio = resposta.data?.relatorio;
      if (typeof relatorio !== 'string' || !relatorio.trim()) throw new Error('Relatório vazio');
      setDados((anterior) => ({ ...anterior, relatorio }));
    } catch (error) {
      console.error('Falha ao gerar parecer a partir da rede IBM:', error);
      setErroIA('Não foi possível gerar o parecer do IBM AML-Data agora. Verifique a API e tente novamente.');
    } finally {
      setCarregandoIA(false);
    }
  }

  return <main className="nl-feature-page nl-feature-page--ai" aria-labelledby="ai-title">
    <div className="nl-feature-heading"><div>
      <span className="nl-feature-eyebrow">ANÁLISE ASSISTIDA / IBM AML-DATA</span>
      <h1 id="ai-title">NEXUS AI</h1>
      <p>O Gemini gera um parecer textual a partir das métricas do grafo IBM, sem criar alertas ou funcionar como chatbot.</p>
    </div></div>
    <DatasetNotice unavailable={indisponivel} status={situacao}/>
    {carregando && <p className="nl-feature-state" role="status">Carregando o recorte IBM para análise...</p>}
    {erro && <div className="nl-feature-state nl-feature-state--error" role="alert">{erro} <button type="button" onClick={recarregar}>Tentar novamente</button></div>}
    {dados && <section className="nl-ai-card">
      <p className="nl-ai-context">IBM AML-Data HI-Small · conjunto sintético · {dados.nos.length} contas no recorte · {dados.arestas.length} transações no recorte · score {dados.score_risco ?? '—'}/100</p>
      {erroIA && <p className="nl-feature-state nl-feature-state--error" role="alert">{erroIA}</p>}
      <AIInsights relatorio={dados.relatorio} carregando={carregandoIA} onGerar={gerarRelatorio}/>
    </section>}
    <p className="nl-feature-note">O relatório descreve apenas métricas do recorte IBM. São dados sintéticos, e nenhuma classificação garante ocorrência de lavagem de dinheiro.</p>
  </main>;
}
