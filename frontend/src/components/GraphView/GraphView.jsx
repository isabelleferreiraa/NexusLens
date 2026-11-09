import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { construirModeloGrafo, filtrarModeloGrafo } from '../../utils/graphLayout';
import './GraphView.css';

const nomesRisco = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo', outros: 'Não classificado' };
const coresRisco = { alto: '#336a9f', medio: '#5387b8', baixo: '#83b2da', outros: '#99b0c3' };

function formatarValor(value, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

function ContaNode({ data, selected }) {
  const inicial = String(data.nome || '?').charAt(0).toLocaleUpperCase('pt-BR');
  return (
    <div className={'nx-orbit-account nx-orbit-account--' + data.risco + (selected ? ' nx-orbit-account--selected' : '')} title={data.nome + ' · ' + nomesRisco[data.risco]}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="nx-orbit-halo" aria-hidden="true" />
      <div className="nx-orbit-core" aria-hidden="true">
        <span className="nx-orbit-initial">{inicial}</span>
        <span className="nx-orbit-spark nx-orbit-spark--one"/>
        <span className="nx-orbit-spark nx-orbit-spark--two"/>
      </div>
      <span className="nx-orbit-name">{data.nome}</span>
      <span className="nx-orbit-meta">{data.grau} {data.grau === 1 ? 'conexão' : 'conexões'}</span>
    </div>
  );
}
const nodeTypes = { account: ContaNode };

function GraphView({ nos = [], arestas = [], currency = 'USD' }) {
  const [filtroRisco, setFiltroRisco] = useState('todos');
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState(null);
  const flow = useRef(null);
  const [posicoes, setPosicoes] = useState({});
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const modelo = useMemo(() => construirModeloGrafo(nos, arestas), [nos, arestas]);
  const filtrado = useMemo(() => filtrarModeloGrafo(modelo, filtroRisco), [modelo, filtroRisco]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => flow.current?.fitView({ padding: 0.28, duration: 280 }));
    return () => window.cancelAnimationFrame(frame);
  }, [filtroRisco, modelo]);
  const selecionado = filtrado.nos.find((no) => no.id === selecionadoId) ?? null;
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const buscaIds = useMemo(() => new Set(filtrado.nos.filter((no) => no.nome.toLocaleLowerCase('pt-BR').includes(termo) || no.id.toLocaleLowerCase('pt-BR').includes(termo)).map((no) => no.id)), [filtrado.nos, termo]);
  const conexos = useMemo(() => {
    if (!selecionado) return new Set();
    const ids = new Set([selecionado.id]);
    for (const edge of filtrado.arestas) {
      if (edge.source === selecionado.id) ids.add(edge.target);
      if (edge.target === selecionado.id) ids.add(edge.source);
    }
    return ids;
  }, [filtrado.arestas, selecionado]);
  const nodes = useMemo(() => filtrado.nos.map((no) => ({
    id: no.id,
    type: 'account',
    position: posicoes[no.id] || no.position,
    data: no,
    className: 'nx-account-node',
    draggable: true,
    selectable: true,
    style: { opacity: (termo && !buscaIds.has(no.id)) || (selecionado && !conexos.has(no.id)) ? 0.23 : 1 },
    ariaLabel: `Conta ${no.nome}, classificação ${nomesRisco[no.risco]}, ${no.grau} conexões`,
  })), [filtrado.nos, posicoes, termo, buscaIds, selecionado, conexos]);
  useEffect(() => { setFlowNodes(nodes); }, [nodes, setFlowNodes]);
  const aoTerminarArraste = (_, node) => {
    setPosicoes((anteriores) => ({ ...anteriores, [node.id]: { ...node.position } }));
  };
  const reorganizar = () => { setPosicoes({}); flow.current?.fitView({ padding: 0.3, duration: 250 }); };
  const edges = useMemo(() => filtrado.arestas.map((e) => {
    const destaque = selecionado && (e.source === selecionado.id || e.target === selecionado.id);
    const opacidade = selecionado ? (destaque ? 0.94 : 0.12) : termo && !buscaIds.has(e.source) && !buscaIds.has(e.target) ? 0.12 : 0.65;
    return {
      id: e.id, source: e.source, target: e.target,
      type: 'default',
      style: { stroke: destaque ? '#4da1df' : '#a4bfd0', strokeWidth: destaque ? 2.6 : 1.3, opacity: opacidade },
    };
  }), [filtrado.arestas, selecionado, termo, buscaIds]);

  const escolher = (id) => { setSelecionadoId(id); };
  const limpar = () => { setFiltroRisco('todos'); setBusca(''); setSelecionadoId(null); flow.current?.fitView({ padding: 0.25, duration: 300 }); };
  const riscos = [{ id: 'todos', label: 'Todas', total: modelo.nos.length }, ...Object.entries(modelo.distribuicao).map(([id, total]) => ({ id, label: nomesRisco[id], total }))];

  return <section className="nx-graph-container" aria-labelledby="nx-graph-title">
    <div className="nx-graph-header">
      <div><div className="nx-graph-overline">MAPEAMENTO DE CONEXÕES</div><h2 id="nx-graph-title">Constelação financeira</h2><p>Arraste as bolinhas azuis, aproxime o zoom e investigue as conexões entre contas.</p></div>
      <span className="nx-graph-counter">{filtrado.nos.length} contas <span>·</span> {filtrado.arestas.length} transações</span>
    </div>
    <div className="nx-graph-toolbar">
      <label className="nx-graph-search"><span className="sr-only">Buscar conta</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar conta ou identificador" /></label>
      <label className="nx-graph-filter">Classificação <select value={filtroRisco} onChange={(event) => { setFiltroRisco(event.target.value); setSelecionadoId(null); }} aria-label="Filtrar contas por classificação">{riscos.map((r) => <option key={r.id} value={r.id}>{r.label} ({r.total})</option>)}</select></label>
      <button type="button" className="nx-graph-tool-button" onClick={() => flow.current?.fitView({ padding: 0.25, duration: 300 })}>Enquadrar</button>
      <button type="button" className="nx-graph-tool-button" onClick={reorganizar}>Reorganizar nós</button>
      <button type="button" className="nx-graph-tool-button nx-graph-tool-button--clear" onClick={limpar} disabled={!busca && filtroRisco === 'todos' && !selecionado}>Limpar</button>
    </div>
    <div className="nx-graph-shell">
      <div className="nx-graph-wrapper">
        {filtrado.nos.length > 0 ? <ReactFlow
          nodes={flowNodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3, maxZoom: 1.15 }}
          onInit={(instance) => { flow.current = instance; }} onNodesChange={onNodesChange} onNodeDragStop={aoTerminarArraste} onNodeClick={(_, node) => escolher(node.id)}
          onPaneClick={() => escolher(null)} nodesDraggable nodesConnectable={false} edgesFocusable={false}
          minZoom={0.08} maxZoom={1.7} attributionPosition="bottom-left" proOptions={{ hideAttribution: false }}
        ><Background variant={BackgroundVariant.Dots} gap={23} size={1.15} color="#d3e2ee" />
          <Controls className="nx-graph-controls" showInteractive={false} />
          <MiniMap className="nx-graph-minimap" maskColor="rgba(236,244,249,.72)" nodeColor={(node) => coresRisco[node.data?.risco] ?? coresRisco.outros} pannable zoomable />
        </ReactFlow> : <div className="nx-graph-empty">Nenhuma conta corresponde ao filtro selecionado. <button type="button" onClick={limpar}>Limpar filtros</button></div>}
      </div>
      {selecionado && <aside className="nx-selected-account" aria-label="Detalhes da conta selecionada">
        <button type="button" className="nx-selected-close" aria-label="Fechar detalhes" onClick={() => escolher(null)}>×</button>
        <div className="nx-selected-overline">CONTA SELECIONADA</div>
        <div className={'nx-selected-avatar nx-selected-avatar--' + selecionado.risco} aria-hidden="true">{selecionado.nome.charAt(0).toLocaleUpperCase('pt-BR')}</div>
        <h3>{selecionado.nome}</h3><p className="nx-selected-id" title={selecionado.id}>{selecionado.id}</p>
        <span className={'nx-selected-risk nx-selected-risk--' + selecionado.risco}>{nomesRisco[selecionado.risco]}</span>
        <div className="nx-selected-facts"><div><span>Contas conectadas</span><strong>{selecionado.grau}</strong></div><div><span>Transações relacionadas</span><strong>{selecionado.quantidade}</strong></div></div>
        <div className="nx-selected-amount"><span>Volume relacionado</span><strong>{selecionado.possuiValorIndisponivel ? 'Não informado' : formatarValor(selecionado.valor, currency)}</strong></div>
        <p>Esta classificação é heurística. As conexões não comprovam fraude.</p>
      </aside>}
      <div className="nx-graph-hint">Arraste uma bolinha para movê-la <span>·</span> Clique para ver conexões <span>·</span> Use o zoom</div>
    </div>
    <div className="nx-graph-footer"><div className="nx-graph-legend">{Object.entries(nomesRisco).map(([id, label]) => <span key={id} className="nx-legend-item"><i className={'nx-risk-dot nx-risk-dot--' + id} />{label}</span>)}</div><span>Dados e classificações fornecidos pela API</span></div>
  </section>;
}

export default GraphView;
