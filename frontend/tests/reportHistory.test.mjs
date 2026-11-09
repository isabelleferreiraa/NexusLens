import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORTS_KEY, createReportRecord, readReportHistory, saveReportHistory, removeReportHistory, printableReportHtml, MAX_REPORTS } from '../src/utils/reportHistory.js';
const fakeStorage = () => {
  let state = new Map();
  return { getItem:k=>state.get(k)??null, setItem:(k,v)=>state.set(k,v) };
};
const payload = {score_risco:45,classificacao:'Médio',metricas:{quantidade_nos:31,quantidade_arestas:40}};
const rec = (id,relatorio='Parecer simples',time='2026-11-09T12:00:00.000Z') => createReportRecord({id,relatorio,criado_em:time,payload});

test('saves a valid IBM report in local storage', () => {
  const storage=fakeStorage(); const record=rec('r1');
  assert.equal(saveReportHistory(storage, record).ok,true);
  assert.deepEqual(readReportHistory(storage),[record]);
  assert.equal(JSON.parse(storage.getItem(REPORTS_KEY)).length,1);
});
test('rejects invalid dataset and nonfinite scores',()=>{
  assert.equal(saveReportHistory(fakeStorage(), {...rec('r1'),dataset:'unknown'}).ok,false);
  assert.equal(createReportRecord({id:'a',relatorio:'X',criado_em:new Date().toISOString(),payload:{...payload,score_risco:NaN}}),null);
});
test('keeps most recent reports first and caps at 30',()=>{
  const storage=fakeStorage();
  for(let i=0;i<33;i++)saveReportHistory(storage,rec(`report${i}`,'Text',new Date(Date.UTC(2026,10,9,0,i)).toISOString()));
  const history=readReportHistory(storage);
  assert.equal(history.length,MAX_REPORTS); assert.equal(history[0].id,'report32');assert.equal(history.at(-1).id,'report3');
});
test('does not fabricate stored data after corrupt JSON',()=>{
  const storage=fakeStorage(); storage.setItem(REPORTS_KEY,'{broken');
  assert.deepEqual(readReportHistory(storage),[]);
});
test('storage quotas do not falsely report success',()=>{
  const storage={getItem:()=>null,setItem:()=>{throw new Error('Quota exceeded')}};
  assert.equal(saveReportHistory(storage,rec('x')).ok,false);
});
test('deletes just the selected report',()=>{
  const storage=fakeStorage();saveReportHistory(storage,rec('a'));saveReportHistory(storage,rec('b'));
  assert.equal(removeReportHistory(storage,'a').ok,true);assert.deepEqual(readReportHistory(storage).map(r=>r.id),['b']);
  assert.equal(removeReportHistory(storage,'missing').ok,false);
});
test('printable HTML escapes AI-supplied tags and preserves metadata',()=>{
  const printable=printableReportHtml(rec('x','<script>alert("x")</script>\nLinha 2'));
  assert.ok(printable.includes('&lt;script&gt;'));
  assert.ok(!printable.includes('<script>'));
  assert.ok(printable.includes('31'));
  assert.ok(printable.includes('Salvar como PDF'));
});
test('rejects overly long reports and malformed records',()=>{
  assert.equal(rec('x','a'.repeat(17000)),null);
  assert.equal(printableReportHtml({relatorio:'abc'}),null);
});
