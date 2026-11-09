/** Exploratory review queue only. Items are API signals, not persisted investigation cases. */
const norm = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const rank = { alto: 0, medio: 1 };
export const PATTERN_NAMES = Object.freeze({
  ida_volta_24h: 'Ida e volta',
  dispersao_24h: 'Distribuição rápida',
  ciclo_72h: 'Ciclo entre contas',
});

export function summarizeQueue(signals = []) {
  return {
    total: signals.length,
    high: signals.filter(s => s.nivel === 'alto').length,
    medium: signals.filter(s => s.nivel === 'medio').length,
    evidence: new Set(signals.flatMap(s => s.transacoes_ids ?? [])).size,
  };
}

export function filterQueue(signals = [], { search = '', severity = 'todos', pattern = 'todos' } = {}) {
  const term = norm(search).trim();
  return signals.filter(s =>
    (severity === 'todos' || s.nivel === severity) &&
    (pattern === 'todos' || s.regra === pattern) &&
    (!term || [s.id, s.titulo, s.descricao, s.conta_principal, ...s.contas, ...s.transacoes_ids]
      .some(part => norm(part).includes(term)))
  ).sort((a, b) =>
    (rank[a.nivel] ?? 2) - (rank[b.nivel] ?? 2) ||
    (b.quantidade_evidencias ?? 0) - (a.quantidade_evidencias ?? 0) ||
    a.id.localeCompare(b.id)
  );
}
