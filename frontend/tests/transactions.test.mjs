import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarTransacoes, resumoTransacoes, filtrarTransacoes, formatarMoeda, formatarData } from '../src/utils/transactions.js';

const rows = normalizarTransacoes([
  { origem: 'a', destino: 'b', valor: 1200 },
  { origem: 'b', destino: 'c', valor: 500, id: 'abc123', tipo: 'PIX', data: '2026-10-31T08:40:00' },
  { origem: 'a', destino: 'c', valor: 10000 },
], [{ id: 'a', nome: 'Ana' },{ id: 'b', nome: 'Beto' },{ id: 'c', nome: 'Carla' }]);

test('normaliza registros sem inventar data, tipo ou ID', () => {
  assert.equal(rows[0].identificador, null);
  assert.equal(rows[0].data, null);
  assert.equal(rows[0].tipo, null);
  assert.equal(rows[1].identificador, 'abc123');
  assert.equal(rows[1].tipo, 'PIX');
  assert.equal(rows[1].nomeDestino, 'Carla');
});
test('calcula somente métricas fornecidas pela API', () => {
  assert.deepEqual(resumoTransacoes(rows), { total: 3, contas: 3, volume: 11700 });
});
test('filtra por conta e valor em conjunto', () => {
  assert.equal(filtrarTransacoes(rows, { busca:'ana', min:'2000' }).length, 1);
  assert.equal(filtrarTransacoes(rows, { busca:'carla', max:'1000' }).length, 1);
});
test('ordena por valores e por data quando disponíveis', () => {
  assert.equal(filtrarTransacoes(rows, { ordenacao:'valor-desc' })[0].valor, 10000);
  assert.equal(filtrarTransacoes(rows, { ordenacao:'valor-asc' })[0].valor, 500);
  assert.equal(filtrarTransacoes(rows, { de:'2026-10-30' }).length, 1);
});
test('formata dados sem fabricar informação', () => {
  assert.equal(formatarMoeda(1200), 'R$ 1.200,00');
  assert.equal(formatarData(null), 'Não informada');
  assert.equal(formatarData('2026-10-31T08:40:00'), '31/10/2026');
});
test('não interpreta valor ausente como zero', () => {
  const t = normalizarTransacoes([{ origem:'a', destino:'b', valor:null }]);
  assert.equal(t[0].valor, null);
  assert.equal(resumoTransacoes(t).volume, null);
});
