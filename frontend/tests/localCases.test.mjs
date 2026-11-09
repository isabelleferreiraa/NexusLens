import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_CASES_KEY, decodeCases, addLocalCase, changeCaseStatus,
  updateCaseNote, summarizeCases, filterCases, persistLocalCases, loadLocalCases,
} from '../src/utils/localCases.js';

const signal = {
  id:'ida_volta_24h-abc', regra:'ida_volta_24h', titulo:'Ida e volta',
  descricao:'Transações nos dois sentidos', nivel:'medio', contas:['A','B'],
  transacoes_ids:['T1','T2'], quantidade_evidencias:2, valor_relacionado:150,
  moeda:'USD', inicio:'2022-01-01T00:00:00', fim:'2022-01-01T01:00:00', observacao:'Revisão humana',
};
const t1='2026-11-08T10:00:00.000Z',t2='2026-11-08T11:00:00.000Z';

test('case starts only when user opens it and retains original evidence', () => {
  const cases=addLocalCase([],signal,t1);
  assert.equal(cases.length,1);
  assert.equal(cases[0].status,'aberto');
  assert.equal(cases[0].signal.transacoes_ids.length,2);
  signal.contas.push('C');
  assert.deepEqual(cases[0].signal.contas,['A','B']);
  assert.strictEqual(addLocalCase(cases,{...signal},t2),cases);
});
test('moving status preserves audit history and ignores same-status move', () => {
  const initial=addLocalCase([],{...signal},t1);
  const middle=changeCaseStatus(initial,initial[0].id,'em_analise',t2);
  assert.equal(middle[0].status,'em_analise');
  assert.equal(middle[0].history.length,2);
  assert.strictEqual(changeCaseStatus(middle,middle[0].id,'em_analise',t2)[0],middle[0]);
  assert.throws(()=>changeCaseStatus(middle,middle[0].id,'resolvido',t2));
});
test('notes have a size limit and can be edited without changing status', () => {
  const before=addLocalCase([],{...signal},t1);
  const after=updateCaseNote(before,before[0].id,'  Revisado em equipe  ',t2);
  assert.equal(after[0].note,'Revisado em equipe');
  assert.equal(after[0].status,'aberto');
  assert.equal(after[0].history.at(-1).action,'observacao');
  assert.throws(()=>updateCaseNote(before,before[0].id,'x'.repeat(801),t2));
});
test('filter cases without accents and compute statuses', () => {
  const base=addLocalCase([],{...signal},t1);
  const moved=changeCaseStatus(base,base[0].id,'concluido',t2);
  assert.deepEqual(summarizeCases(moved),{total:1,aberto:0,em_analise:0,concluido:1});
  assert.equal(filterCases(moved,{search:'transacoes',status:'concluido'}).length,1);
  assert.deepEqual(filterCases(moved,{status:'aberto'}),[]);
});
test('local storage round trip and malformed JSON are handled', () => {
  const store=new Map();
  const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
  const cases=addLocalCase([],{...signal},t1);
  persistLocalCases(storage,cases);
  assert.deepEqual(loadLocalCases(storage),cases);
  assert.ok(store.has(LOCAL_CASES_KEY));
  assert.throws(()=>decodeCases('not-json'));
  assert.throws(()=>decodeCases(JSON.stringify({version:1,cases:[{id:'fake'}]})));
});
test('storage write errors propagate so UI never claims success', () => {
  const cases=addLocalCase([],{...signal},t1);
  const storage={setItem:()=>{throw new Error('quota exceeded');}};
  assert.throws(()=>persistLocalCases(storage,cases),/quota exceeded/);
});
test('synthetic signal validation prevents accidental wrong currency', () => {
  assert.throws(()=>addLocalCase([],{...signal,moeda:'BRL'},t1));
});
