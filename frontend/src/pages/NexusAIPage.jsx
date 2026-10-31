import { useState } from 'react';
import useGrafo from '../hooks/useGrafo';
import api from '../services/api';
import AIInsights from '../components/AIInsights/AIInsights';
import '../styles/feature-pages.css';

export default function NexusAIPage() {
  const { dados, setDados, carregando, erro, recarregar } = useGrafo();
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');

  async function gerarRelatorio() {
    if (!dados || carregandoIA) return;
    setCarregandoIA(true);
    setErroIA('');
    try {
      const resposta = await api.post('/relatorio', dados);
      const relatorio = resposta.data?.relatorio;
      if (typeof relatorio !== 'string' || !relatorio.trim()) throw new Error('Relatório vazio');
      setDados((anterior) => ({ ...anterior, relatorio }));
    } catch (error) {
      console.error('Falha ao gerar parecer:', error);
      setErroIA('Não foi possível gerar o parecer agora. Tente novamente em instantes.');
    } finally {
      setCarregandoIA(false);
    }
  }

  return (
    <main className="nl-feature-page nl-feature-page--ai" aria-labelledby="ai-title">
      <div className="nl-feature-heading">
        <div><span className="nl-feature-eyebrow">ANÁLISE ASSISTIDA POR IA</span>
          <h1 id="ai-title">NEXUS AI</h1>
          <p>Gere um parecer em português a partir das métricas da rede financeira.</p></div>
      </div>
      {carregando && <p className="nl-feature-state" role="status">Carregando dados para análise...</p>}
      {erro && <div className="nl-feature-state nl-feature-state--error" role="alert">{erro} <button type="button" onClick={recarregar}>Tentar novamente</button></div>}
      {dados && (
        <section className="nl-ai-card">
          <p className="nl-ai-context">Rede demonstrativa · {dados.nos.length} contas · {dados.arestas.length} transações · score {dados.score_risco ?? '—'}/100</p>
          {erroIA && <p className="nl-feature-state nl-feature-state--error" role="alert">{erroIA}</p>}
          <AIInsights relatorio={dados.relatorio} carregando={carregandoIA} onGerar={gerarRelatorio}/>
        </section>
      )}
      <p className="nl-feature-note">O Gemini descreve os dados calculados pelo backend; não determina se houve fraude. Revise o parecer antes de utilizá-lo.</p>
    </main>
  );
}
