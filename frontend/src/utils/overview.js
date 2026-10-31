const riscoNormalizado = (risco) => String(risco || '').trim().toLocaleLowerCase('pt-BR');

export function getOverview(dados) {
  const nos = Array.isArray(dados?.nos) ? dados.nos : [];
  const arestas = Array.isArray(dados?.arestas) ? dados.arestas : [];
  const distribuicao = { alto: 0, medio: 0, baixo: 0, outros: 0 };

  const contas = nos.map((no) => {
    const risco = riscoNormalizado(no.risco);
    const categoria = risco === 'alto' ? 'alto' : risco === 'médio' || risco === 'medio' ? 'medio' : risco === 'baixo' ? 'baixo' : 'outros';
    distribuicao[categoria] += 1;
    const transacoes = arestas.filter((item) => String(item.origem ?? item.source) === String(no.id) || String(item.destino ?? item.target) === String(no.id)).length;
    return { ...no, categoria, transacoes, nome: no.nome || `Conta ${no.id}` };
  });

  const prioridade = { alto: 2, medio: 1, baixo: 0, outros: -1 };
  const contasRevisao = contas.filter((c) => c.categoria === 'alto' || c.categoria === 'medio')
    .sort((a, b) => prioridade[b.categoria] - prioridade[a.categoria] || b.transacoes - a.transacoes);

  return {
    contas: nos.length,
    transacoes: arestas.length,
    score: typeof dados?.score_risco === 'number' ? Math.min(100, Math.max(0, dados.score_risco)) : null,
    classificacao: dados?.classificacao ?? '—',
    revisao: contasRevisao.length,
    contasRevisao,
    distribuicao,
  };
}
