import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { IBM_AML } from '../utils/datasets';
import { readReportHistory, REPORTS_KEY } from '../utils/reportHistory';
import { loadLocalCases, LOCAL_CASES_KEY } from '../utils/localCases';
import { interpretIbmStatus } from '../utils/uiPreferences';
import '../styles/settings.css';

function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

function localSummary() {
  const storage = browserStorage();
  if (!storage) return { reports: null, cases: null };
  let reports = null;
  let cases = null;
  try { reports = readReportHistory(storage).length; } catch { /* unavailable */ }
  try { cases = loadLocalCases(storage).length; } catch { /* unavailable */ }
  return { reports, cases };
}

export default function SettingsPage({ preferences, onChange, onNavigate }) {
  const [status, setStatus] = useState({ kind: 'loading' });
  const [counts, setCounts] = useState(localSummary);
  const [notice, setNotice] = useState('');

  const checkDataset = useCallback(async (signal) => {
    setStatus({ kind: 'loading' });
    try {
      const response = await api.get(IBM_AML.status, { signal, timeout: 15000 });
      const result = interpretIbmStatus(response.data);
      if (!result) throw new Error('Formato de status inesperado');
      if (!signal?.aborted) setStatus({ kind: 'ready', result });
    } catch (error) {
      if (signal?.aborted || error?.code === 'ERR_CANCELED') return;
      setStatus({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    checkDataset(controller.signal);
    return () => controller.abort();
  }, [checkDataset]);

  useEffect(() => {
    function handleStorage(event) {
      if (!event.key || [REPORTS_KEY, LOCAL_CASES_KEY].includes(event.key)) setCounts(localSummary());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function changePreference(field, value) {
    const saved = onChange({ ...preferences, [field]: value });
    setNotice(saved ? 'Preferência salva neste navegador.' : 'Preferência aplicada nesta aba, mas não foi possível salvá-la.');
  }

  const displayCount = number => number === null ? 'Indisponível' : number.toLocaleString('pt-BR');
  const dataset = status.kind === 'ready' ? status.result : null;

  return <main className="nl-settings" aria-labelledby="nl-settings-title">
    <header className="nl-settings-header">
      <span className="nl-settings-eyebrow">WORKSPACE / PREFERÊNCIAS</span>
      <h1 id="nl-settings-title">CONFIGURAÇÕES</h1>
      <p>Personalize a experiência e consulte o estado da fonte IBM utilizada nesta implantação.</p>
    </header>

    {notice && <div className="nl-settings-notice" role="status">{notice} <button type="button" onClick={() => setNotice('')}>Fechar</button></div>}

    <div className="nl-settings-grid">
      <section className="nl-settings-card" aria-labelledby="settings-preferences">
        <div className="nl-settings-card-head"><span className="nl-settings-eyebrow">NESTE NAVEGADOR</span><h2 id="settings-preferences">Aparência e navegação</h2><p>Estas escolhas não modificam o servidor nem o banco de dados.</p></div>
        <label className="nl-settings-option">
          <span><strong>Iniciar com menu lateral recolhido</strong><small>Salva o estado do menu para suas próximas visitas.</small></span>
          <input type="checkbox" checked={preferences.sidebarCollapsed} onChange={(event) => changePreference('sidebarCollapsed', event.target.checked)} />
        </label>
        <label className="nl-settings-option">
          <span><strong>Reduzir animações</strong><small>Minimiza transições visuais. A preferência do sistema também é respeitada.</small></span>
          <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => changePreference('reduceMotion', event.target.checked)} />
        </label>
      </section>

      <section className="nl-settings-card" aria-labelledby="settings-dataset">
        <div className="nl-settings-card-head"><span className="nl-settings-eyebrow">LEITURA DA API</span><h2 id="settings-dataset">Fonte dos dados</h2><p>Consultamos apenas o status da API desta implantação, sem alterar dados.</p></div>
        <div className="nl-settings-source"><strong>IBM AML-Data · HI-Small</strong><span>Conjunto sintético · moeda USD</span></div>
        <div className="nl-settings-status" role="status" aria-live="polite">
          {status.kind === 'loading' && <p>Verificando disponibilidade da API...</p>}
          {status.kind === 'error' && <p className="nl-settings-status-error">Não foi possível consultar o status agora. Isso não significa necessariamente que o dataset está vazio.</p>}
          {dataset && <>
            <p><span className={'nl-settings-indicator ' + (dataset.available ? 'nl-settings-indicator--ready' : '')} aria-hidden="true" />
              <strong>{dataset.available ? 'Amostra disponível nesta implantação' : dataset.state === 'vazio' ? 'Tabelas vazias nesta implantação' : 'Dataset não importado nesta implantação'}</strong></p>
            <div className="nl-settings-numbers"><div><small>Contas</small><strong>{displayCount(dataset.accounts)}</strong></div><div><small>Transações</small><strong>{displayCount(dataset.transactions)}</strong></div></div>
          </>}
        </div>
        <button type="button" className="nl-settings-button" disabled={status.kind === 'loading'} onClick={() => checkDataset()}>Verificar novamente</button>
        <p className="nl-settings-footnote">Esta verificação não consulta diretamente a branch <code>dev-ibm-aml</code> do Neon. O ambiente de testes e a API publicada podem mostrar resultados diferentes.</p>
      </section>

      <section className="nl-settings-card nl-settings-card--wide" aria-labelledby="settings-browser">
        <div className="nl-settings-card-head"><span className="nl-settings-eyebrow">ARMAZENAMENTO LOCAL</span><h2 id="settings-browser">Registros deste navegador</h2><p>Os dados abaixo ficam neste dispositivo e não são compartilhados com outros usuários.</p></div>
        <div className="nl-settings-local-grid">
          <div className="nl-settings-local-item"><div><span>Relatórios gerados</span><strong>{displayCount(counts.reports)}</strong><small>Histórico de pareceres do Gemini</small></div><button type="button" onClick={() => onNavigate('reports')}>Ver relatórios</button></div>
          <div className="nl-settings-local-item"><div><span>Investigações locais</span><strong>{displayCount(counts.cases)}</strong><small>Kanban demonstrativo, sem sincronização</small></div><button type="button" onClick={() => onNavigate('cases')}>Ver investigações</button></div>
        </div>
        <p className="nl-settings-footnote">Não salve dados pessoais ou informações bancárias reais neste ambiente demonstrativo. Estas configurações não incluem autenticação, controle de acesso ou administração do PostgreSQL.</p>
      </section>
    </div>
  </main>;
}
