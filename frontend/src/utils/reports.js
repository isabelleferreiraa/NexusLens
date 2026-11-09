/** Restrict Gemini requests to a complete IBM graph's aggregate metrics.
 * Never forward transaction rows, node identities or simulator labels.
 */
export function ibmReportPayload(graph) {
  if (graph?.dataset !== 'ibm-aml-hi-small' || graph?.disponivel !== true ||
      graph?.moeda !== 'USD' || graph?.dados_sinteticos !== true) return null;

  const score = graph.score_risco;
  const classification = graph.classificacao;
  const metrics = graph.metricas;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100 ||
      typeof classification !== 'string' || !classification.trim() ||
      !metrics || typeof metrics !== 'object' || Array.isArray(metrics)) return null;

  const { quantidade_nos, quantidade_arestas, nivel_influencia,
    quantidade_conexoes, papel_na_rede } = metrics;
  if (![quantidade_nos, quantidade_arestas].every(value => Number.isInteger(value) && value >= 0) ||
      ![nivel_influencia, quantidade_conexoes, papel_na_rede].every(value => typeof value === 'string' && value.trim())) return null;

  return {
    score_risco: score,
    classificacao: classification,
    metricas: { quantidade_nos, quantidade_arestas, nivel_influencia,
      quantidade_conexoes, papel_na_rede },
  };
}
