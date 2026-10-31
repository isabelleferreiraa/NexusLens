import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { normalizarTransacoes, resumoTransacoes, filtrarTransacoes, formatarMoeda, formatarData } from '../utils/transactions';
import TransactionDetailsDrawer from '../components/transactions/TransactionDetailsDrawer';
import '../styles/transactions.css';

const iniciais = { busca: '', min: '', max: '', de: '', ate: '', ordenacao: 'valor-desc' };

function NomeConta({ nome, id }) {
  return <span className="nl-tx-account"><strong>{nome || 'Conta sem nome'}</strong><small title={id}>{id.length > 18 ? `${id.slice(0, 8)}…${id.slice(-5)}` : id}</small></span>;
}

export default function TransactionsPage({ onNavigate }) {
  const [transacoes, setTransacoes] = useState([]);
  const [filtros, setFiltros] = useState(iniciais);
  const [selecionada, setSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [avisos, setAvisos] = useState('');
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro('');
      setAvisos('');
      const [listagem, grafo] = await Promise.allSettled([api.get('/transacoes'), api.get('/grafo')]);
      if (!ativo) return;
      const lista = listagem.status === 'fulfilled' && Array.isArray(listagem.value.data) ? listagem.value.data : null;
      const rede = grafo.status === 'fulfilled' ? grafo.value.data : null;
      const arestas = Array.isArray(rede?.arestas) ? rede.arestas : null;
      if (lista === null && arestas === null) {
        setErro('Não foi possível carregar as transações da API.');
        setTransacoes([]);
      } else {
        setTransacoes(normalizarTransacoes(lista ?? arestas, Array.isArray(rede?.nos) ? rede.nos : []));
        if (lista === null) setAvisos('A listagem de transações está indisponível; exibindo as conexões retornadas pela rede.');
        else if (!Array.isArray(rede?.nos)) setAvisos('Os nomes das contas estão indisponíveis; exibindo os identificadores.');
      }
      setCarregando(false);
    }
    carregar();
    return () => { ativo = false; };
  }, [recarregar]);

  const filtradas = useMemo(() => filtrarTransacoes(transacoes, filtros), [transacoes, filtros]);
  const resumo = useMemo(() => resumoTransacoes(transacoes), [transacoes]);
  const datasDisponiveis = transacoes.some((t) => Boolean(t.data));
  const alterarFiltro = (chave, valor) => setFiltros((anterior) => ({ ...anterior, [chave]: valor }));

  return <main className="nl-transactions" aria-labelledby="nl-transactions-title">
    <div className="nl-tx-heading">
      <div><span className="nl-tx-eyebrow">MONITORAMENTO / TRANSFERÊNCIAS</span><h1 id="nl-transactions-title">TRANSAÇÕES</h1>
        <p>Consulte movimentações financeiras e explore as contas relacionadas.</p></div>
      <button className="nl-tx-refresh" type="button" disabled={carregando} onClick={() => setRecarregar((v) => v + 1)}>↻ Atualizar lista</button>
    </div>
    {erro && <div className="nl-tx-message nl-tx-message--error" role="alert">{erro} <button type="button" onClick={() => setRecarregar((v) => v + 1)}>Tentar novamente</button></div>}
    {avisos && <p className="nl-tx-message" role="status">{avisos}</p>}
    {carregando && <p className="nl-tx-message" role="status">Carregando transações...</p>}
    <section className="nl-tx-kpis" aria-label="Resumo das transações">
      <article><span>Transações</span><strong>{carregando || erro ? '—' : resumo.total}</strong><small>Movimentações registradas</small></article>
      <article><span>Volume total</span><strong>{carregando || erro ? '—' : formatarMoeda(resumo.volume)}</strong><small>Soma dos valores disponíveis</small></article>
      <article><span>Contas relacionadas</span><strong>{carregando || erro ? '—' : resumo.contas}</strong><small>Participantes distintos</small></article>
    </section>
    <section className="nl-tx-panel" aria-labelledby="nl-tx-history">
      <div className="nl-tx-panel-head"><div><h2 id="nl-tx-history">Histórico de transações</h2><p>Selecione um registro para abrir seus detalhes.</p></div><span>{filtradas.length} de {transacoes.length}</span></div>
      <div className="nl-tx-filters">
        <label className="nl-tx-field nl-tx-field--search">Buscar conta ou identificador<input value={filtros.busca} onChange={(e) => alterarFiltro('busca', e.target.value)} placeholder="Nome, conta, ID..." type="search"/></label>
        <label className="nl-tx-field">Valor mínimo<input value={filtros.min} onChange={(e) => alterarFiltro('min', e.target.value)} type="number" min="0" step="0.01" placeholder="R$ 0,00"/></label>
        <label className="nl-tx-field">Valor máximo<input value={filtros.max} onChange={(e) => alterarFiltro('max', e.target.value)} type="number" min="0" step="0.01" placeholder="Sem limite"/></label>
        <label className="nl-tx-field">Ordenar<select value={filtros.ordenacao} onChange={(e) => alterarFiltro('ordenacao', e.target.value)}><option value="valor-desc">Maior valor</option><option value="valor-asc">Menor valor</option>{datasDisponiveis && <option value="recentes">Mais recentes</option>}</select></label>
      </div>
      {datasDisponiveis ? <div className="nl-tx-date-filters"><label className="nl-tx-field">De<input type="date" value={filtros.de} onChange={(e) => alterarFiltro('de', e.target.value)}/></label><label className="nl-tx-field">Até<input type="date" value={filtros.ate} onChange={(e) => alterarFiltro('ate', e.target.value)}/></label></div> : <p className="nl-tx-data-note">A API atual não fornece datas das transações; o filtro por período ficará disponível quando esses dados estiverem presentes.</p>}
      <div className="nl-tx-table-scroll"><table className="nl-tx-table"><thead><tr><th>Origem</th><th>Destino</th><th>Valor</th><th>Tipo</th><th>Data</th><th><span className="sr-only">Detalhes</span></th></tr></thead>
        <tbody>{filtradas.map((t) => <tr key={t.chave}>
          <td><NomeConta nome={t.nomeOrigem} id={t.origem}/></td>
          <td><NomeConta nome={t.nomeDestino} id={t.destino}/></td>
          <td className="nl-tx-value">{formatarMoeda(t.valor)}</td>
          <td>{t.tipo || '—'}</td>
          <td>{t.data ? formatarData(t.data) : '—'}</td>
          <td><button className="nl-tx-details-button" type="button" onClick={() => setSelecionada(t)} aria-label={`Ver detalhes do registro ${t.indice}`}>Detalhes ↗</button></td>
        </tr>)}</tbody>
      </table></div>
      {!carregando && !erro && filtradas.length === 0 && <p className="nl-tx-empty">Nenhuma transação encontrada. Ajuste os filtros ou limpe a pesquisa.</p>}
      <div className="nl-tx-footer"><span>Dados retornados pelo backend do NexusLens.</span><button type="button" onClick={() => setFiltros({ ...iniciais })}>Limpar filtros</button></div>
    </section>
    {selecionada && <TransactionDetailsDrawer transacao={selecionada} onClose={() => setSelecionada(null)} onNetwork={() => { setSelecionada(null); onNavigate('network'); }} />}
  </main>;
}
