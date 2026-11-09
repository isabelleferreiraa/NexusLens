import { useState } from 'react';
import useGrafo from '../hooks/useGrafo';
import api from '../services/api';
import DatasetNotice from '../components/layout/DatasetNotice';
import { ibmReportPayload } from '../utils/reports';
import { createReportRecord, saveReportHistory } from '../utils/reportHistory';
import AIInsights from '../components/AIInsights/AIInsights';
import '../styles/feature-pages.css';

function localStorageOrNull() {
  try { return window.localStorage; } catch { return null; }
}

export default function NexusAIPage({ onNavigate }) {
  const { dados, setDados, carregando, erro, indisponivel, situacao, recarregar } = useGrafo();
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [notice, setNotice] = useState('');

  async function gerarRelatorio() {
    if (carregandoIA) return;
    const payload = ibmReportPayload(dados);
    if (!payload) {
      setErroIA('As métricas da IBM estão incompletas; atualize a rede antes de gerar o relatório.');
      return;
    }
    setCarregandoIA(true);
    setErroIA('');
    setNotice('');
    try {
      // Gemini apenas redige; não recebe contas, transferências ou rótulos da simulação.
      const resposta = await api.post('/relatorio', payload);
      const relatorio = resposta.data?.relatorio;
      if (typeof relatorio !== 'string' || !relatorio.trim() ||
          /^não foi possível gerar (o )?relatório/i.test(relatorio.trim())) {
        throw new Error('Nenhum parecer válido retornado pelo backend');
      }
      setDados((anterior) => ({ ...anterior, relatorio }));
      const record = createReportRecord({
        id: window.crypto?.randomUUID?.() ?? `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        criado_em: new Date().toISOString(), relatorio, payload,
      });
      const saved = record ? saveReportHistory(localStorageOrNull(), record) : { ok: false };
      setNotice(saved.ok
        ? 'Parecer gerado e salvo neste navegador. Você pode consultá-lo em Relatórios.'
        : 'Parecer gerado, mas não foi possível salvar no histórico deste navegador.');
    } catch (error) {
      console.error('Falha ao gerar parecer IBM:', error);
      setErroIA('Não foi possível gerar o parecer IBM agora. Verifique a API e tente novamente.');
    } finally {
      setCarregandoIA(false);
    }
  }

  return <main className="nl-feature-page nl-feature-page--ai" aria-labelledby="ai-title">
    <div className="nl-feature-heading"><div>
      <span className="nl-feature-eyebrow">ANÁLISE ASSISTIDA / IBM AML-DATA</span>
      <h1 id="ai-title">NEXUS AI</h1>
      <p>O Gemini gera pareceres escritos a partir das métricas estruturais do grafo IBM.</p>
    </div><button type="button" className="nl-action-button" onClick={() => onNavigate('reports')}>Ver histórico de relatórios ↗</button></div>
    <DatasetNotice unavailable={indisponivel} status={situacao}/>
    {carregando && <p className="nl-feature-state" role="status">Carregando o recorte IBM para análise...</p>}
    {erro && <div className="nl-feature-state nl-feature-state--error" role="alert">{erro} <button type="button" onClick={recarregar}>Tentar novamente</button></div>}
    {dados && <section className="nl-ai-card">
      <p className="nl-ai-context">IBM AML-Data HI-Small · dados sintéticos · {dados.nos.length} contas no recorte · {dados.arestas.length} transações no recorte · score {dados.score_risco ?? '—'}/100</p>
      {erroIA && <p className="nl-feature-state nl-feature-state--error" role="alert">{erroIA}</p>}
      {notice && <p className="nl-feature-state" role="status">{notice}</p>}
      <AIInsights relatorio={dados.relatorio} carregando={carregandoIA} onGerar={gerarRelatorio}/>
    </section>}
    <p className="nl-feature-note">Os relatórios são armazenados somente neste navegador. O Gemini descreve métricas agregadas; não identifica fraudes nem executa investigações. Requer revisão humana.</p>
  </main>;
}
