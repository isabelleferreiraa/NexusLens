import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('o React não possui seletor nem estado de fonte demonstrativa', () => {
  const app = read('App.jsx');
  assert.doesNotMatch(app, /DatasetSelector|setDataset|dataset=\{dataset\}/);
  assert.match(app, /IBM AML-DATA/);
});
test('o grafo utiliza exclusivamente a API IBM', () => {
  const hook = read('hooks/useGrafo.js');
  assert.match(hook, /api\.get\(IBM_AML\.graph\)/);
  assert.doesNotMatch(hook, /api\.get\(['"]\/grafo['"]\)/);
});
test('a página de transações não contém fallback para os endpoints antigos', () => {
  const page = read('pages/TransactionsPage.jsx');
  assert.match(page, /api\.get\(IBM_AML\.transactions/);
  assert.doesNotMatch(page, /api\.get\(['"]\/transacoes['"]\)/);
  assert.doesNotMatch(page, /api\.get\(['"]\/grafo['"]\)/);
  assert.match(page, /PAGE_SIZE/);
});
test('o Gemini só gera um relatório com dados do grafo IBM', () => {
  const page = read('pages/NexusAIPage.jsx');
  assert.match(page, /useGrafo\(\)/);
  assert.match(page, /api\.post\(['"]\/relatorio['"], dados\)/);
  assert.match(page, /!dados\.disponivel/);
});
