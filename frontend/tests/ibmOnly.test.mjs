import test from 'node:test';
import assert from 'node:assert/strict';
import { IBM_AML, sourceMessage, syntheticAccountName, validateIbmGraph } from '../src/utils/datasets.js';
import { normalizarTransacoes, formatarMoeda } from '../src/utils/transactions.js';
import { criarSinaisEstruturais } from '../src/utils/alerts.js';

test('Somente a IBM está configurada como fonte', () => {
  assert.equal(IBM_AML.graph, '/datasets/ibm-aml/grafo');
  assert.equal(IBM_AML.transactions, '/datasets/ibm-aml/transacoes');
  assert.equal(IBM_AML.currency, 'USD');
  assert.equal(IBM_AML.pageSize, 200);
});
test('Nunca aceita dados demo ou payload sem selo de disponibilidade IBM', () => {
  assert.equal(validateIbmGraph({ nos: [], arestas: [] }).ok, false);
  assert.equal(validateIbmGraph({ disponivel: true, moeda: 'BRL', nos: [], arestas: [] }).ok, false);
  assert.equal(validateIbmGraph({ disponivel: true, moeda: 'USD', nos: [], arestas: [] }).ok, false);
});
test('Indisponibilidade mostra mensagem, sem fallback demonstrativo', () => {
  const result = validateIbmGraph({ disponivel: false, situacao: 'nao_importado' });
  assert.equal(result.unavailable, true);
  assert.match(sourceMessage(result.status), /Não estamos exibindo registros da base antiga/);
  assert.match(sourceMessage('vazio'), /não há transações/);
});
test('IDs de contas IBM não viram nomes de pessoas reais', () => {
  assert.equal(syntheticAccountName('bank:10|account:12345678'), 'Conta ···5678');
});
test('Movimentações IBM preservam datas, IDs e USD', () => {
  const rows = normalizarTransacoes([{
    id_transacao: 'ibm-aml-hi-small:9', origem: 'a', destino: 'b', valor: 12.5,
    moeda: 'USD', data_transacao: '2022-09-01T03:14:00', tipo_transacao: 'Wire',
  }], [{id:'a',nome:'Conta 01'}, {id:'b',nome:'Conta 02'}]);
  assert.equal(rows[0].chave, 'ibm-aml-hi-small:9');
  assert.equal(rows[0].moeda, 'USD');
  assert.equal(rows[0].data.slice(0,10), '2022-09-01');
  assert.match(formatarMoeda(rows[0].valor), /US\$/);
});
test('NexusLens calcula alertas apenas com métricas, sem rótulo do simulador', () => {
  const data = { nos:[{id:'1',nome:'Conta 1',risco:'Alto'}], arestas:[{origem:'1',destino:'1',valor:42,is_laundering_label:true}]};
  const sinais = criarSinaisEstruturais(data);
  assert.equal(sinais.length,1);
  assert.equal('is_laundering_label' in sinais[0], false);
});
