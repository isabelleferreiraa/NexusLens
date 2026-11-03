import test from 'node:test';
import assert from 'node:assert/strict';
import { construirModeloGrafo, filtrarModeloGrafo, nivelRisco } from '../src/utils/graphLayout.js';

const nos=[{id:'a',nome:'Alice',risco:'ALTO'},{id:'b',nome:'Bruno',risco:'Médio'},{id:'c',nome:'Carla',risco:'Baixo'},{id:'d',nome:'Dani',risco:'Desconhecido'}];
const arestas=[{origem:'a',destino:'b',valor:150},{origem:'a',destino:'c',valor:100},{origem:'b',destino:'c',valor:null},{origem:'a',destino:'a',valor:50}];

test('normaliza categorias com e sem acento',()=>{
  assert.equal(nivelRisco('MÉDIO'),'medio');
  assert.equal(nivelRisco('medio'),'medio');
  assert.equal(nivelRisco('baixo'),'baixo');
  assert.equal(nivelRisco(''),'outros');
});
test('mantém posições estáveis mesmo após nova execução',()=>{
  assert.deepEqual(construirModeloGrafo(nos,arestas),construirModeloGrafo(nos,arestas));
});
test('conta relações únicas e transações com valores válidos',()=>{
  const m=construirModeloGrafo(nos,arestas);
  const a=m.nos.find(n=>n.id==='a'),b=m.nos.find(n=>n.id==='b');
  assert.equal(a.grau,2);assert.equal(a.quantidade,3);assert.equal(a.valor,300);
  assert.equal(b.possuiValorIndisponivel,true);
  assert.equal(m.distribuicao.outros,1);
});
test('filtra nós e mantém arestas entre contas visíveis',()=>{
  const m=construirModeloGrafo(nos,arestas);
  assert.equal(filtrarModeloGrafo(m,'alto').nos.length,1);
  assert.equal(filtrarModeloGrafo(m,'alto').arestas.length,1);
  assert.equal(filtrarModeloGrafo(m,'todos').arestas.length,4);
});
test('descarta arestas com IDs inexistentes',()=>{
  assert.equal(construirModeloGrafo(nos,[...arestas,{origem:'x',destino:'a',valor:1}]).arestas.length,arestas.length);
});
