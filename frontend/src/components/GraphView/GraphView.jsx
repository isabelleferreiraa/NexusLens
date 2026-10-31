import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import "./GraphView.css";

const CORES = {
  Alto: { fundo: "#642c3c", borda: "#e9798e" },
  "Médio": { fundo: "#594324", borda: "#e9bc62" },
  Baixo: { fundo: "#214438", borda: "#65cfa1" },
};

function GraphView({ nos = [], arestas = [], selecionadoId, onSelecionarNo }) {
  const { nodes, edges } = useMemo(() => {
    const ordenados = [...nos].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const quantidade = ordenados.length;
    const colunas = Math.ceil(Math.sqrt(quantidade * 1.5));

    const nodes = ordenados.map((no, index) => {
      const selecionado = String(no.id) === String(selecionadoId);
      const cor = CORES[no.risco] ?? CORES.Baixo;
      let position;
      if (quantidade <= 14) {
        const angulo = (2 * Math.PI * index) / Math.max(quantidade, 1) - Math.PI / 2;
        const raio = Math.max(250, quantidade * 25);
        position = {
          x: 430 + Math.cos(angulo) * raio,
          y: 290 + Math.sin(angulo) * raio * 0.72,
        };
      } else {
        position = { x: (index % colunas) * 200, y: Math.floor(index / colunas) * 115 };
      }

      return {
        id: String(no.id),
        position,
        data: { label: no.nome ?? "Conta sem nome" },
        style: {
          background: cor.fundo,
          color: "#f4f6ff",
          border: "2px solid " + (selecionado ? "#d6c5ff" : cor.borda),
          borderRadius: "11px",
          padding: "11px 13px",
          minWidth: "150px",
          textAlign: "center",
          fontSize: "12px",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: selecionado ? "750" : "600",
          boxShadow: selecionado ? "0 0 0 5px #a78bfa33, 0 8px 30px #0007" : "0 6px 20px #0005",
          transition: "box-shadow .2s, border-color .2s",
        },
      };
    });

    const edges = arestas.map((aresta, index) => {
      const relacionada = String(aresta.origem) === String(selecionadoId) ||
        String(aresta.destino) === String(selecionadoId);
      return {
        id: String(aresta.id ?? "e-" + index),
        source: String(aresta.origem),
        target: String(aresta.destino),
        style: {
          stroke: relacionada ? "#b39aff" : "#57647d",
          strokeWidth: relacionada ? 2.7 : 1.4,
          opacity: selecionadoId && !relacionada ? 0.45 : 0.85,
        },
        animated: false,
      };
    });

    return { nodes, edges };
  }, [nos, arestas, selecionadoId]);

  if (!nos.length) {
    return <div className="nx-graph-empty" role="status">Aguardando dados estruturais da rede...</div>;
  }

  return (
    <div className="nx-graph-container">
      <div className="nx-graph-legend" aria-label="Legenda de risco">
        <span className="nx-legend-item"><i className="nx-dot nx-dot--red" /> Alto</span>
        <span className="nx-legend-item"><i className="nx-dot nx-dot--yellow" /> Médio</span>
        <span className="nx-legend-item"><i className="nx-dot nx-dot--green" /> Baixo</span>
      </div>
      <div className="nx-graph-wrapper" aria-label="Grafo interativo de relacionamentos entre contas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, no) => onSelecionarNo?.(no.id)}
          attributionPosition="bottom-right"
        >
          <Background color="#293145" gap={19} size={1} />
          <Controls className="nx-graph-controls" showInteractive={false} />
          <MiniMap
            nodeColor={(no) => no.style?.background ?? "#44506b"}
            maskColor="rgba(10, 14, 27, 0.68)"
            className="nx-graph-minimap"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default GraphView;
