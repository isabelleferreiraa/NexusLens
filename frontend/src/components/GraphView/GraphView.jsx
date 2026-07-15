import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphView.css';

function GraphView({ nos = [], arestas = [] }) {
  
  // Transforma os dados da API para o formato exigido pelo React Flow
  const { nodes, edges } = useMemo(() => {
    
    const transformedNodes = nos.map((no, index) => {
      // Determina a cor com base no nível de risco (se disponível no dado)
      // Ajuste os nomes das propriedades caso a API as envie de forma diferente
      const risco = no.risco || no.risk || '';
      let color = '#38BDF8'; // Azul padrão
      let shadow = 'rgba(56, 189, 248, 0.4)';
      
      if (risco.toLowerCase() === 'alto') {
        color = '#EF4444';
        shadow = 'rgba(239, 68, 68, 0.4)';
      } else if (risco.toLowerCase() === 'médio' || risco.toLowerCase() === 'medio') {
        color = '#FACC15';
        shadow = 'rgba(250, 204, 21, 0.4)';
      } else if (risco.toLowerCase() === 'baixo') {
        color = '#22C55E';
        shadow = 'rgba(34, 197, 94, 0.4)';
      }

      return {
        id: String(no.id || index),
        // Adiciona posição randômica caso o backend não forneça as coordenadas (x,y)
        position: no.position || { 
          x: Math.random() * 500 + 50, 
          y: Math.random() * 300 + 50 
        },
        data: { 
          label: no.nome || no.label || no.id || 'Nó' 
        },
        style: {
          background: color,
          color: '#111827',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '10px',
          boxShadow: `0 4px 14px ${shadow}`,
        }
      };
    });

    const transformedEdges = arestas.map((aresta, index) => ({
      id: String(aresta.id || `e-${index}`),
      source: String(aresta.origem || aresta.source),
      target: String(aresta.destino || aresta.target),
      animated: true,
      style: { stroke: 'rgba(139, 92, 246, 0.6)', strokeWidth: 2 },
    }));

    return { nodes: transformedNodes, edges: transformedEdges };
  }, [nos, arestas]);

  if (!nos.length || !arestas.length) {
    return (
      <div className="nx-graph-empty">
        <div className="nx-graph-empty__icon">🕸️</div>
        <p>A rede financeira está sendo analisada ou não há dados suficientes para exibir o grafo.</p>
      </div>
    );
  }

  return (
    <div className="nx-graph-container">
      <div className="nx-graph-header">
        <div className="section-header">
          <h2>Rede Financeira</h2>
          <span className="section-badge">Visão Interativa</span>
        </div>
        <div className="nx-graph-legend">
          <span className="nx-legend-item"><span className="nx-dot nx-dot--red"></span> Alto</span>
          <span className="nx-legend-item"><span className="nx-dot nx-dot--yellow"></span> Médio</span>
          <span className="nx-legend-item"><span className="nx-dot nx-dot--green"></span> Baixo</span>
        </div>
      </div>
      
      <div className="nx-graph-wrapper">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#2D3748" gap={20} size={1} />
          <Controls className="nx-graph-controls" />
          <MiniMap 
            nodeColor={(n) => n.style?.background || '#38BDF8'} 
            maskColor="rgba(11, 17, 32, 0.7)"
            className="nx-graph-minimap"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default GraphView;
