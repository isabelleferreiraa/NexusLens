import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { IBM_AML, syntheticAccountName } from '../utils/datasets';
import { normalizarTransacoes, resumoTransacoes, filtrarTransacoes, formatarMoeda, formatarData } from '../utils/transactions';
import DatasetNotice from '../components/layout/DatasetNotice';
import TransactionDetailsDrawer from '../components/transactions/TransactionDetailsDrawer';
import '../styles/transactions.css';
import '../styles/dataset-pagination.css';

const initialFilters = { busca: '', min: '', max: '', de: '', ate: '', ordenacao: 'valor-desc' };
const PAGE_SIZE = IBM_AML.pageSize;
const currency = IBM_AML.currency;

function AccountName({ nome, id }) {
  return <span className="nl-tx-account"><strong>{nome || syntheticAccountName(id)}</strong>
    <small title={id}>{id.length > 18 ? `${id.slice(0, 8)}…${id.slice(-5)}` : id}</small></span>;
}

export default function TransactionsPage({ onNavigate }) {
  const [transacoes, setTransacoes] = useState([]);
  const [filtros, setFiltros] = useState(initialFilters);
  const [selecionada, setSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [indisponivel, setIndisponivel] = useState(false);
  const [situacao, setSituacao] = useState('nao_importado');
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setTransacoes([]);
      setSelecionada(null);
      setErro('');
      setIndisponivel(false);
      setTotal(0);
      try {
        const resposta = await api.get(IBM_AML.transactions, { params: { limit: PAGE_SIZE, offset: pagina * PAGE_SIZE } });
        if (!ativo) return;
        const payload = resposta.data;
        if (payload?.disponivel === false) {
          setIndisponivel(true);
          setSituacao(payload.situacao ?? 'nao_importado');
          return;
        }
        if (payload?.disponivel !== true || payload?.moeda !== currency || !Array.isArray(payload.transacoes)) {
          throw new Error('Resposta da API IBM inesperada');
        }
        const contas = new Map();
        for (const item of payload.transacoes) {
          for (const id of [item.origem, item.destino]) {
            if (id) contas.set(id, { id, nome: syntheticAccountName(id) });
          }
        }
        setTransacoes(normalizarTransacoes(payload.transacoes, [...contas.values()]));
        setTotal(payload.total_transacoes);
      } catch (error) {
        if (!ativo) return;
        console.error('Falha ao carregar transações IBM:', error);
        setErro('Não foi possível consultar as transações IBM. Verifique a implantação da API no Render.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [pagina, versao]);

  const filtradas = useMemo(() => filtrarTransacoes(transacoes, filtros), [transacoes, filtros]);
  const resumo = useMemo(() => resumoTransacoes(transacoes), [transacoes]);
  const datasDisponiveis = transacoes.some((t) => Boolean(t.data));
  const hasNext = (pagina + 1) * PAGE_SIZE < total;
  const inicio = total ? pagina * PAGE_SIZE + 1 : 0;
  const fim = pagina * PAGE_SIZE + transacoes.length;
  const atualizarFiltro = (key, value) => setFiltros((anterior) => ({ ...anterior, [key]: value }));

  return <main className="nl-transactions" aria-labelledby="nl-transactions-title">
    <div className="nl-tx-heading">
      <div><span className="nl-tx-eyebrow">IBM AML-DATA / MOVIMENTAÇÕES</span>
        <h1 id="nl-transactions-title">TRANSAÇÕES</h1>
        <p>Movimentações sintéticas da IBM, com identificadores de contas, valores em dólares e datas.</p></div>
      <button className="nl-tx-refresh" type="button" disabled={carregando} onClick={() => setVersao((n) => n + 1)}>↻ Atualizar lista</button>
    </div>
    <DatasetNotice unavailable={indisponivel} status={situacao} />
    {erro && <div className="nl-tx-message nl-tx-message--error" role="alert">{erro} <button type="button" onClick={() => setVersao((n) => n + 1)}>Tentar novamente</button></div>}
    {carregando && <p className="nl-tx-message" role="status">Carregando transações IBM...</p>}
    <section className="nl-tx-kpis" aria-label="Resumo da página">
      <article><span>Transações na página</span><strong>{carregando || erro || indisponivel ? '—' : resumo.total}</strong><small>De {total.toLocaleString('pt-BR')} transações importadas</small></article>
      <article><span>Volume nesta página</span><strong>{carregando || erro || indisponivel ? '—' : formatarMoeda(resumo.volume, currency)}</strong><small>Valores em USD</small></article>
      <article><span>Contas relacionadas</span><strong>{carregando || erro || indisponivel ? '—' : resumo.contas}</strong><small>Na página atual</small></article>
    </section>
    <section className="nl-tx-panel" aria-labelledby="nl-tx-history">
      <div className="nl-tx-panel-head"><div><h2 id="nl-tx-history">Histórico de transações IBM</h2><p>Selecione uma movimentação para examinar seus detalhes.</p></div><span>{total ? `${inicio}–${fim} de ${total}` : '—'}</span></div>
      <p className="nl-tx-data-note">Os filtros e a ordenação são aplicados aos {PAGE_SIZE} registros da página atual, não ao conjunto completo.</p>
      <div className="nl-tx-filters">
        <label className="nl-tx-field nl-tx-field--search">Buscar conta ou identificador<input value={filtros.busca} onChange={(e) => atualizarFiltro('busca', e.target.value)} type="search" placeholder="Nome ou ID" /></label>
        <label className="nl-tx-field">Valor mínimo (USD)<input type="number" min="0" step="0.01" value={filtros.min} onChange={(e) => atualizarFiltro('min', e.target.value)} placeholder="US$ 0,00"/></label>
        <label className="nl-tx-field">Valor máximo (USD)<input type="number" min="0" step="0.01" value={filtros.max} onChange={(e) => atualizarFiltro('max', e.target.value)} placeholder="Sem limite"/></label>
        <label className="nl-tx-field">Ordenar<select value={filtros.ordenacao} onChange={(e) => atualizarFiltro('ordenacao', e.target.value)}><option value="valor-desc">Maior valor</option><option value="valor-asc">Menor valor</option>{datasDisponiveis && <option value="recentes">Mais recentes</option>}</select></label>
      </div>
      {datasDisponiveis && <div className="nl-tx-date-filters">
        <label className="nl-tx-field">De<input type="date" value={filtros.de} onChange={(e) => atualizarFiltro('de', e.target.value)}/></label>
        <label className="nl-tx-field">Até<input type="date" value={filtros.ate} onChange={(e) => atualizarFiltro('ate', e.target.value)}/></label>
      </div>}
      <div className="nl-tx-table-scroll"><table className="nl-tx-table">
        <thead><tr><th>Origem</th><th>Destino</th><th>Valor (USD)</th><th>Tipo</th><th>Data</th><th><span className="sr-only">Detalhes</span></th></tr></thead>
        <tbody>{!erro && filtradas.map((t) => <tr key={t.chave}>
          <td><AccountName nome={t.nomeOrigem} id={t.origem}/></td>
          <td><AccountName nome={t.nomeDestino} id={t.destino}/></td>
          <td className="nl-tx-value">{formatarMoeda(t.valor, currency)}</td>
          <td>{t.tipo || '—'}</td>
          <td>{formatarData(t.data)}</td>
          <td><button className="nl-tx-details-button" type="button" onClick={() => setSelecionada(t)} aria-label={`Detalhes do registro ${t.indice}`}>Detalhes ↗</button></td>
        </tr>)}</tbody>
      </table></div>
      {!carregando && !erro && !indisponivel && filtradas.length === 0 && <p className="nl-tx-empty">Nenhuma transação nesta página corresponde aos filtros.</p>}
      <div className="nl-tx-footer"><span>IBM AML-Data · sintético · USD · {filtradas.length} resultado(s) na página</span>
        <button type="button" onClick={() => setFiltros({ ...initialFilters })}>Limpar filtros</button></div>
      {!carregando && !erro && !indisponivel && total > 0 && <nav className="nl-tx-pagination" aria-label="Paginação das transações IBM">
        <button type="button" disabled={pagina === 0} onClick={() => { setPagina((n) => Math.max(0, n - 1)); setSelecionada(null); }}>← Anterior</button>
        <span>Página {pagina + 1} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <button type="button" disabled={!hasNext} onClick={() => { setPagina((n) => n + 1); setSelecionada(null); }}>Próxima →</button>
      </nav>}
    </section>
    {selecionada && <TransactionDetailsDrawer transacao={selecionada} onClose={() => setSelecionada(null)} onNetwork={() => { setSelecionada(null); onNavigate('network'); }}/>}
  </main>;
}
