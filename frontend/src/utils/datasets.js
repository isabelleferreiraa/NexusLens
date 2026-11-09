/** The IBM AML-Data HI-Small dataset is the ONLY source used by the NexusLens 2.0 UI. */
export const IBM_AML = Object.freeze({
  title: 'IBM AML-Data · sintético',
  currency: 'USD',
  graph: '/datasets/ibm-aml/grafo',
  transactions: '/datasets/ibm-aml/transacoes',
  status: '/datasets/ibm-aml/status',
  pageSize: 200,
});

/** No fallback to the legacy demo records. An unavailable dataset must be visible. */
export function sourceMessage(status = 'nao_importado') {
  if (status === 'vazio') return 'As tabelas da IBM existem, mas ainda não há transações em USD. É necessário importar uma amostra do HI-Small.';
  return 'O IBM AML-Data ainda não foi importado no banco desta implantação. Não estamos exibindo registros da base antiga como substitutos.';
}

export function syntheticAccountName(id) {
  const account = String(id ?? '').split('|account:').at(-1);
  const suffix = account.slice(-4);
  return `Conta ···${suffix || '—'}`;
}

export function validateIbmGraph(payload) {
  if (payload?.disponivel === false) return { ok: false, unavailable: true, status: payload.situacao ?? 'nao_importado' };
  if (payload?.disponivel !== true || payload?.moeda !== IBM_AML.currency ||
      !Array.isArray(payload.nos) || !Array.isArray(payload.arestas)) {
    return { ok: false, unavailable: false };
  }
  return { ok: true, unavailable: false };
}
