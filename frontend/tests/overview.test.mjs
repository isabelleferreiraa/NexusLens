import { strict as assert } from 'node:assert';
import test from 'node:test';
import { getOverview } from '../src/utils/overview.js';

test('conta nós, arestas e classificações sem inventar dados', () => {
  const info = getOverview({
    score_risco: 60, classificacao: 'Médio',
    nos: [{ id: 1, nome: 'Conta A', risco: 'Alto' }, { id: 2, nome: 'Conta B', risco: 'Médio' }, { id: 3, nome: 'Conta C', risco: 'Baixo' }],
    arestas: [{ origem: 1, destino: 2 }, { origem: 1, destino: 3 }, { origem: 2, destino: 3 }],
  });
  assert.equal(info.score, 60);
  assert.equal(info.contas, 3);
  assert.equal(info.transacoes, 3);
  assert.equal(info.revisao, 2);
  assert.equal(info.distribuicao.alto, 1);
  assert.equal(info.contasRevisao[0].transacoes, 2);
});
test('sem dados da API, não exibe números fictícios', () => {
  const info = getOverview(null);
  assert.equal(info.score, null);
  assert.equal(info.contas, 0);
  assert.equal(info.revisao, 0);
});
