import { construirModeloGrafo } from './graphLayout.js';

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

const prioridade = { alto: 2, medio: 1 };

/**
 * A API IBM /datasets/ibm-aml/grafo classifica contas; ela ainda NÃO retorna eventos de alerta.
 * Cada item representa uma conta classificada para revisão, não uma suspeita
 * de transação específica, nem um alerta persistido no banco.
 */
export function criarSinaisEstruturais(dados, fonte = '/datasets/ibm-aml/grafo') {
  if (!Array.isArray(dados?.nos) || !Array.isArray(dados?.arestas)) return [];

  const modelo = construirModeloGrafo(dados.nos, dados.arestas);
  return modelo.nos
    .filter((conta) => conta.risco === 'alto' || conta.risco === 'medio')
    .map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      nivel: conta.risco,
      grau: conta.grau,
      transacoes: conta.quantidade,
      volume: conta.possuiValorIndisponivel ? null : conta.valor,
      texto: conta.risco === 'alto'
        ? 'Conta classificada com risco estrutural alto pela análise da rede.'
        : 'Conta classificada com risco estrutural médio pela análise da rede.',
      fonte,
    }))
    .sort((a, b) => prioridade[b.nivel] - prioridade[a.nivel] || b.grau - a.grau || a.id.localeCompare(b.id));
}

export function resumirSinais(sinais) {
  return {
    total: sinais.length,
    altos: sinais.filter((s) => s.nivel === 'alto').length,
    medios: sinais.filter((s) => s.nivel === 'medio').length,
  };
}

export function filtrarSinais(sinais, { busca = '', nivel = 'todos', ordem = 'prioridade' } = {}) {
  const termo = normalizar(busca);
  return sinais
    .filter((s) => (nivel === 'todos' || s.nivel === nivel) &&
      (!termo || normalizar(s.nome).includes(termo) || normalizar(s.id).includes(termo)))
    .sort((a, b) => {
      if (ordem === 'conexoes') return b.grau - a.grau || prioridade[b.nivel] - prioridade[a.nivel] || a.id.localeCompare(b.id);
      if (ordem === 'transacoes') return b.transacoes - a.transacoes || prioridade[b.nivel] - prioridade[a.nivel] || a.id.localeCompare(b.id);
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR') || a.id.localeCompare(b.id);
      return prioridade[b.nivel] - prioridade[a.nivel] || b.grau - a.grau || a.id.localeCompare(b.id);
    });
}
