import test from 'node:test';
import assert from 'node:assert/strict';
import { filterQueue, summarizeQueue, PATTERN_NAMES } from '../src/utils/investigations.js';

const signals = [
  {id:'a', regra:'ciclo_72h', titulo:'Ciclo', descricao:'Conexões', nivel:'alto', contas:['conta-1','conta-2'], transacoes_ids:['t1','t2','t3'], quantidade_evidencias:3},
  {id:'b', regra:'dispersao_24h', titulo:'Distribuição', descricao:'Múltiplas transferências', nivel:'medio', contas:['conta-2','conta-3'], transacoes_ids:['t2','t4'], quantidade_evidencias:2},
  {id:'c', regra:'ida_volta_24h', titulo:'Ida e volta', descricao:'Volta', nivel:'alto', contas:['conta-4','conta-5'], transacoes_ids:['t5','t6'], quantidade_evidencias:2},
];

test('resume signals without duplicating reused evidence', () => {
  assert.deepEqual(summarizeQueue(signals), {total:3,high:2,medium:1,evidence:6});
});
test('high priority first then evidence count', () => {
  assert.deepEqual(filterQueue(signals).map(x=>x.id),['a','c','b']);
});
test('searches names, transaction ids and accounts accent-insensitively', () => {
  assert.deepEqual(filterQueue(signals,{search:'distribuicao'}).map(x=>x.id),['b']);
  assert.deepEqual(filterQueue(signals,{search:'t6'}).map(x=>x.id),['c']);
  assert.deepEqual(filterQueue(signals,{search:'CONTA-3'}).map(x=>x.id),['b']);
});
test('filters by rule and severity', () => {
  assert.deepEqual(filterQueue(signals,{severity:'alto',pattern:'ida_volta_24h'}).map(x=>x.id),['c']);
  assert.deepEqual(filterQueue(signals,{severity:'medio',pattern:'ciclo_72h'}),[]);
});
test('empty results do not generate placeholder investigations', () => {
  assert.deepEqual(filterQueue([]),[]);
  assert.deepEqual(summarizeQueue([]),{total:0,high:0,medium:0,evidence:0});
  assert.equal(Object.keys(PATTERN_NAMES).length,3);
});
