import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { construirModeloGrafo, filtrarModeloGrafo } from '../../utils/graphLayout';
import './GraphView.css';

const nomes = { alto:'Alto', medio:'Médio', baixo:'Baixo', outros:'Não classificado' };
const cores = { alto:'#336a9f', medio:'#5387b8', baixo:'#83b2da', outros:'#99b0c3' };
const moeda = (n) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);

function ContaNode({ data, selected }) {
  const inicial = String(data.nome || '?').charAt(0).toLocaleUpperCase('pt-BR');
  return (
    <div className={'nx-orbit-account nx-orbit-account--'+data.risco+(selected?' nx-orbit-account--selected':'')} title={data.nome+' · '+nomes[data.risco]}>
      <Handle type="target" position={Position.Left}/>
      <Handle type="source" position={Position.Right}/>
      <span className="nx-orbit-halo" aria-hidden="true"/>
      <span className="nx-orbit-core" aria-hidden="true">
        <span className="nx-orbit-initial">{inicial}</span>
        <span className="nx-orbit-spark nx-orbit-spark--one"/>
        <span className="nx-orbit-spark nx-orbit-spark--two"/>
      </span>
      <span className="nx-orbit-name">{data.nome}</span>
      <span className="nx-orbit-meta">{data.grau} {data.grau===1?'conexão':'conexões'}</span>
    </div>
  );
}
const nodeTypes={account:ContaNode};

export default function GraphView({nos=[],arestas=[]}) {
  const [risco,setRisco]=useState('todos');
  const [busca,setBusca]=useState('');
  const [selecionadoId,setSelecionadoId]=useState(null);
  const [posicoes,setPosicoes]=useState({});
  const flow=useRef(null);
  const [flowNodes,setFlowNodes,onNodesChange]=useNodesState([]);
  const modelo=useMemo(()=>construirModeloGrafo(nos,arestas),[nos,arestas]);
  const filtrado=useMemo(()=>filtrarModeloGrafo(modelo,risco),[modelo,risco]);
  const selecionado=filtrado.nos.find(n=>n.id===selecionadoId)??null;
  const termo=busca.trim().toLocaleLowerCase('pt-BR');
  const buscaIds=useMemo(()=>new Set(filtrado.nos.filter(n=>n.nome.toLocaleLowerCase('pt-BR').includes(termo)||n.id.toLocaleLowerCase('pt-BR').includes(termo)).map(n=>n.id)),[filtrado.nos,termo]);
  const conexos=useMemo(()=>{
    if(!selecionado)return new Set();
    const ids=new Set([selecionado.id]);
    for(const e of filtrado.arestas){
      if(e.source===selecionado.id)ids.add(e.target);
      if(e.target===selecionado.id)ids.add(e.source);
    }
    return ids;
  },[filtrado.arestas,selecionado]);
  const nodes=useMemo(()=>filtrado.nos.map(n=>({
    id:n.id,type:'account',position:posicoes[n.id]||n.position,
    data:n,className:'nx-account-node',draggable:true,selectable:true,
    style:{opacity:(termo&&!buscaIds.has(n.id))||(selecionado&&!conexos.has(n.id)) ? 0.23 : 1},
    ariaLabel:'Conta '+n.nome+', classificação '+nomes[n.risco]+', '+n.grau+' conexões',
  })),[filtrado.nos,posicoes,termo,buscaIds,selecionado,conexos]);
  useEffect(()=>{setFlowNodes(nodes);},[nodes,setFlowNodes]);
  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>flow.current?.fitView({padding:.28,duration:250}));
    return ()=>window.cancelAnimationFrame(frame);
  },[modelo,risco]);
  const edges=useMemo(()=>filtrado.arestas.map(e=>{
    const destacado=selecionado&&(e.source===selecionado.id||e.target===selecionado.id);
    const fade=selecionado?(destacado ? 0.94 : 0.12):(termo&&!buscaIds.has(e.source)&&!buscaIds.has(e.target) ? 0.12 : 0.65);
    return {id:e.id,source:e.source,target:e.target,type:'default',style:{
      stroke:destacado?'#4da1df':'#a4bfd0',strokeWidth:destacado?2.6:1.3,opacity:fade
    }};
  }),[filtrado.arestas,selecionado,termo,buscaIds]);
  const limpar=()=>{setBusca('');setRisco('todos');setSelecionadoId(null);flow.current?.fitView({padding:.25,duration:300});};
  const reorganizar=()=>{setPosicoes({});window.requestAnimationFrame(()=>flow.current?.fitView({padding:.3,duration:250}));};
  const filtros=[{id:'todos',label:'Todas',total:modelo.nos.length},...Object.entries(modelo.distribuicao).map(([id,total])=>({id,label:nomes[id],total}))];

  return (
    <section className="nx-graph-container" aria-labelledby="nx-graph-title">
      <div className="nx-graph-header">
        <div><span className="nx-graph-overline">MAPEAMENTO DE CONEXÕES</span><h2 id="nx-graph-title">Constelação financeira</h2>
          <p>Arraste as bolinhas azuis, aproxime o zoom e explore os relacionamentos entre contas.</p></div>
        <span className="nx-graph-counter">{filtrado.nos.length} contas <span>·</span> {filtrado.arestas.length} transações</span>
      </div>
      <div className="nx-graph-toolbar">
        <label className="nx-graph-search"><span className="sr-only">Buscar conta</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
          <input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar conta ou identificador"/></label>
        <label className="nx-graph-filter">Classificação
          <select value={risco} onChange={e=>{setRisco(e.target.value);setSelecionadoId(null);}} aria-label="Filtrar contas por classificação">
            {filtros.map(f=><option key={f.id} value={f.id}>{f.label} ({f.total})</option>)}
          </select>
        </label>
        <button type="button" className="nx-graph-tool-button" onClick={()=>flow.current?.fitView({padding:.25,duration:300})}>Enquadrar</button>
        <button type="button" className="nx-graph-tool-button" onClick={reorganizar}>Reorganizar nós</button>
        <button type="button" className="nx-graph-tool-button" onClick={limpar} disabled={!busca&&risco==='todos'&&!selecionado}>Limpar</button>
      </div>
      <div className="nx-graph-shell">
        <div className="nx-graph-wrapper">
          {filtrado.nos.length>0?
            <ReactFlow nodes={flowNodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.3,maxZoom:1.15}}
              onInit={inst=>{flow.current=inst;}} onNodesChange={onNodesChange}
              onNodeDragStop={(_,node)=>setPosicoes(old=>({...old,[node.id]:{...node.position}}))}
              onNodeClick={(_,node)=>setSelecionadoId(node.id)} onPaneClick={()=>setSelecionadoId(null)}
              nodesDraggable nodesConnectable={false} edgesFocusable={false}
              minZoom={.08} maxZoom={1.7} attributionPosition="bottom-left">
              <Background variant={BackgroundVariant.Dots} gap={23} size={1.15} color="#d3e2ee"/>
              <Controls className="nx-graph-controls" showInteractive={false}/>
              <MiniMap className="nx-graph-minimap" maskColor="rgba(236,244,249,.72)" nodeColor={n=>cores[n.data?.risco]??cores.outros} pannable zoomable/>
            </ReactFlow>:
            <div className="nx-graph-empty">Nenhuma conta corresponde ao filtro. <button type="button" onClick={limpar}>Limpar filtros</button></div>}
        </div>
        {selecionado&&<aside className="nx-selected-account" aria-label="Detalhes da conta selecionada">
          <button className="nx-selected-close" aria-label="Fechar detalhes" type="button" onClick={()=>setSelecionadoId(null)}>×</button>
          <span className="nx-selected-overline">CONTA SELECIONADA</span>
          <span className="nx-selected-avatar" aria-hidden="true">{selecionado.nome.charAt(0).toLocaleUpperCase('pt-BR')}</span>
          <h3>{selecionado.nome}</h3><p className="nx-selected-id" title={selecionado.id}>{selecionado.id}</p>
          <span className={'nx-selected-risk nx-selected-risk--'+selecionado.risco}>{nomes[selecionado.risco]}</span>
          <div className="nx-selected-facts">
            <div><span>Contas conectadas</span><strong>{selecionado.grau}</strong></div>
            <div><span>Transações relacionadas</span><strong>{selecionado.quantidade}</strong></div>
          </div>
          <div className="nx-selected-amount"><span>Volume relacionado</span><strong>{selecionado.possuiValorIndisponivel?'Não informado':moeda(selecionado.valor)}</strong></div>
          <p>Esta classificação é heurística. As conexões não comprovam fraude.</p>
        </aside>}
        <div className="nx-graph-hint">Arraste uma bolinha para movê-la <span>·</span> Clique para ver conexões <span>·</span> Use o zoom</div>
      </div>
      <div className="nx-graph-footer">
        <div className="nx-graph-legend">{Object.entries(nomes).map(([id,label])=><span className="nx-legend-item" key={id}><i className={'nx-risk-dot nx-risk-dot--'+id}/>{label}</span>)}</div>
        <span>Dados e classificações fornecidos pela API</span>
      </div>
    </section>
  );
}
