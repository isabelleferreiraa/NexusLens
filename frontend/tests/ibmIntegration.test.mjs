import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIbmGraph, validateIbmTransactionsPage } from '../src/utils/datasets.js';
import { ibmReportPayload } from '../src/utils/reports.js';

const graph = () => ({
  dataset: 'ibm-aml-hi-small', disponivel: true, dados_sinteticos: true,
  moeda: 'USD', total_transacoes: 2, transacoes_no_recorte: 2,
  nos: [{ id: 'a', nome: 'Conta A', risco: 'Alto' }, { id: 'b', nome: 'Conta B', risco: 'Médio' }],
  arestas: [{ id:'t1', origem:'a', destino:'b', valor:12.5, moeda:'USD' },
    { id:'t2', origem:'b', destino:'a', valor:20, moeda:'USD' }],
  score_risco: 60, classificacao: 'Médio',
  metricas: { quantidade_nos:2, quantidade_arestas:2, nivel_influencia:'Média',
    quantidade_conexoes:'Moderada', papel_na_rede:'Participante relevante' },
});

test('aceita apenas resposta de grafo coerente da IBM em USD', () => {
  assert.equal(validateIbmGraph(graph()).ok, true);
  const mixed = graph(); mixed.arestas[0].moeda = 'BRL';
  assert.equal(validateIbmGraph(mixed).ok, false);
  const orphan = graph(); orphan.arestas[0].origem = 'missing';
  assert.equal(validateIbmGraph(orphan).ok, false);
  const empty = graph(); empty.arestas = []; empty.transacoes_no_recorte = 0;
  assert.equal(validateIbmGraph(empty).ok, false);
});
test('não reutiliza respostas sem identificar a IBM nem dados de demonstração', () => {
  const missing = graph(); delete missing.dataset;
  assert.equal(validateIbmGraph(missing).ok, false);
  const unready = { disponivel: false, situacao: 'nao_importado' };
  assert.equal(validateIbmGraph(unready).unavailable, true);
});
test('exige que todas as transações de uma página estejam em USD', () => {
  const page = { dataset:'ibm-aml-hi-small', disponivel:true, dados_sinteticos:true,
    moeda:'USD',total_transacoes:1,transacoes:[{origem:'a',destino:'b',valor:20,moeda:'USD'}] };
  assert.equal(validateIbmTransactionsPage(page),true);
  page.transacoes[0].moeda='Euro';
  assert.equal(validateIbmTransactionsPage(page),false);
});
test('o relatório Gemini recebe SOMENTE métricas agregadas', () => {
  const original = graph(); original.is_laundering_label=true;
  const payload = ibmReportPayload(original);
  assert.deepEqual(Object.keys(payload).sort(), ['classificacao','metricas','score_risco']);
  assert.equal(payload.metricas.quantidade_arestas,2);
  assert.equal('nos' in payload,false);
  assert.equal('arestas' in payload,false);
  assert.equal('is_laundering_label' in payload,false);
});
test('impede relatório de grafos inválidos/incompletos', () => {
  const invalid = graph(); invalid.metricas.papel_na_rede='';
  assert.equal(ibmReportPayload(invalid),null);
  const missing = graph(); missing.disponivel=false;
  assert.equal(ibmReportPayload(missing),null);
});
