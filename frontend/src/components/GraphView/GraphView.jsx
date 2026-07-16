import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphView.css';

function GraphView({ nos = [], arestas = [] }) {
  
  const { nodes, edges } = useMemo(() => {
    
    const transformedNodes = nos.map((no, index) => {
      const risco = no.risco || no.risk || '';
      
      // Cores sólidas corporativas
      let color = '#3182CE'; // Blue
      let borderColor = '#2B6CB0';
      
      if (risco.toLowerCase() === 'alto') {
        color = '#DA3633'; // Red
        borderColor = '#9B2C2C';
      } else if (risco.toLowerCase() === 'médio' || risco.toLowerCase() === 'medio') {
        color = '#D29922'; // Yellow
        borderColor = '#975A16';
      } else if (risco.toLowerCase() === 'baixo') {
        color = '#238636'; // Green
        borderColor = '#1G6325';
      }

      return {
        id: String(no.id || index),
        position: no.position || { 
          x: Math.random() * 500 + 50, 
          y: Math.random() * 300 + 50 
        },
        data: { 
          label: no.nome || no.label || no.id || 'Nó' 
        },
        style: {
          background: color,
          color: '#ffffff',
          border: `2px solid ${borderColor}`,
          borderRadius: '4px', // Formato mais quadrado/técnico
          padding: '6px 12px',
          minWidth: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '500',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }
      };
    });

    const transformedEdges = arestas.map((aresta, index) => ({
      id: String(aresta.id || `e-${index}`),
      source: String(aresta.origem || aresta.source),
      target: String(aresta.destino || aresta.target),
      animated: false, // Remoção de animação para maior sobriedade
      style: { stroke: '#484F58', strokeWidth: 1.5 },
    }));

    return { nodes: transformedNodes, edges: transformedEdges };
  }, [nos, arestas]);

  if (!nos.length || !arestas.length) {
    return (
      <div className="nx-graph-empty">
        <p>Aguardando dados estruturais da rede...</p>
      </div>
    );
  }

  return (
    <div className="nx-graph-container">
      <div className="nx-graph-header">
        <div className="section-header" style={{ border: 'none', margin: 0, padding: 0 }}>
          <h2>Topologia de Transações</h2>
        </div>
        <div className="nx-graph-legend">
          <span className="nx-legend-item"><span className="nx-dot nx-dot--red"></span> Critical</span>
          <span className="nx-legend-item"><span className="nx-dot nx-dot--yellow"></span> Warning</span>
          <span className="nx-legend-item"><span className="nx-dot nx-dot--green"></span> Normal</span>
        </div>
      </div>
      
      <div className="nx-graph-wrapper">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#30363D" gap={16} size={1} />
          <Controls className="nx-graph-controls" />
          <MiniMap 
            nodeColor={(n) => n.style?.background || '#3182CE'} 
            maskColor="rgba(14, 17, 23, 0.6)"
            className="nx-graph-minimap"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default GraphView;
