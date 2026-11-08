import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSinaisEstruturais, resumirSinais, filtrarSinais } from '../src/utils/alerts.js';

const dados = {
  nos: [
    { id: 'a', nome: 'José', risco: 'Alto' },
    { id: 'b', nome: 'Ana', risco: 'Médio' },
    { id: 'c', nome: 'Bruno', risco: 'Baixo' },
    { id: 'd', nome: 'Maria', risco: 'Alto' },
  ],
  arestas: [
    { origem: 'a', destino: 'b', valor: 50 },
    { origem: 'a', destino: 'c', valor: 120 },
    { origem: 'd', destino: 'b', valor: null },
  ],
};

test('usa apenas contas classificadas pelo backend como altas ou médias', () => {
  const sinais = criarSinaisEstruturais(dados);
  assert.equal(sinais.length, 3);
  assert.deepEqual(resumirSinais(sinais), { total: 3, altos: 2, medios: 1 });
  assert.equal(sinais.some((s) => s.nome === 'Bruno'), false);
});
test('ordena por prioridade e conexões reais, sem score por conta inventado', () => {
  const sinais = criarSinaisEstruturais(dados);
  assert.equal(sinais[0].nome, 'José');
  assert.equal(sinais[0].grau, 2);
  assert.equal(sinais[0].transacoes, 2);
  assert.equal(sinais[0].volume, 170);
  assert.equal(sinais[1].nome, 'Maria');
  assert.equal(sinais[1].volume, null);
});
test('busca nomes sem depender de acentos', () => {
  const sinais = criarSinaisEstruturais(dados);
  assert.deepEqual(filtrarSinais(sinais, { busca: 'jose' }).map((s) => s.id), ['a']);
});
test('filtra prioridade e ordena por volume de conexões', () => {
  const sinais = criarSinaisEstruturais(dados);
  assert.deepEqual(filtrarSinais(sinais, { nivel: 'medio' }).map((s) => s.nome), ['Ana']);
  assert.equal(filtrarSinais(sinais, { ordem: 'transacoes' })[0].nome, 'José');
});
test('não cria sinais quando a API está indisponível ou todos têm baixo risco', () => {
  assert.deepEqual(criarSinaisEstruturais(null), []);
  assert.deepEqual(criarSinaisEstruturais({ nos: [dados.nos[2]], arestas: [] }), []);
});
