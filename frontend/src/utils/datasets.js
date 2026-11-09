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

/** Validate the actual API payload; a healthy import must not silently look empty. */
export function validateIbmGraph(payload) {
  if (payload?.disponivel === false) return {
    ok: false, unavailable: true, status: payload.situacao ?? 'nao_importado',
  };
  if (payload?.dataset !== 'ibm-aml-hi-small' || payload?.disponivel !== true ||
      payload?.moeda !== IBM_AML.currency || payload?.dados_sinteticos !== true ||
      !Array.isArray(payload.nos) || !Array.isArray(payload.arestas) ||
      !payload.nos.length || !payload.arestas.length ||
      payload.arestas.length > 1500 ||
      payload.transacoes_no_recorte !== payload.arestas.length ||
      !Number.isInteger(payload.total_transacoes) || payload.total_transacoes < payload.arestas.length ||
      typeof payload.score_risco !== 'number' || !Number.isFinite(payload.score_risco) ||
      !payload.metricas || typeof payload.metricas !== 'object') {
    return { ok: false, unavailable: false };
  }
  const ids = new Set(payload.nos.map(no => no?.id));
  if (ids.has(undefined) || ids.size !== payload.nos.length || payload.arestas.some(
    edge => !ids.has(edge?.origem) || !ids.has(edge?.destino) ||
      edge.moeda !== 'USD' || 'is_laundering_label' in edge ||
      typeof edge.valor !== 'number' || !Number.isFinite(edge.valor)
  )) return { ok: false, unavailable: false };
  return { ok: true, unavailable: false };
}

/** Page-level transaction guard to prevent accidentally displaying mixed data. */
export function validateIbmTransactionsPage(payload) {
  if (payload?.dataset !== 'ibm-aml-hi-small' || payload?.disponivel !== true ||
      payload?.moeda !== IBM_AML.currency || payload?.dados_sinteticos !== true ||
      !Number.isInteger(payload?.total_transacoes) || payload.total_transacoes < 0 ||
      !Array.isArray(payload?.transacoes) || payload.transacoes.length > IBM_AML.pageSize) return false;
  return payload.transacoes.every(item => item?.moeda === IBM_AML.currency &&
    typeof item?.origem === 'string' && !!item.origem &&
    typeof item?.destino === 'string' && !!item.destino &&
    typeof item?.valor === 'number' && Number.isFinite(item.valor));
}
