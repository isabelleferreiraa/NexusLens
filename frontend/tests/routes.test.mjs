import { strict as assert } from 'node:assert';
import test from 'node:test';
import { pages, pageFromPath } from '../src/routes.js';

test('cada página possui rota única', () => {
  assert.equal(Object.keys(pages).length, 8);
  assert.equal(new Set(Object.values(pages).map((item) => item.path)).size, 8);
});
test('navegação inicial, caminho com barra final e rota inexistente', () => {
  assert.equal(pageFromPath('/'), 'overview');
  assert.equal(pageFromPath('/rede-financeira/'), 'network');
  assert.equal(pageFromPath('/nexus-ai'), 'ai');
  assert.equal(pageFromPath('/nao-existe'), 'notFound');
});
