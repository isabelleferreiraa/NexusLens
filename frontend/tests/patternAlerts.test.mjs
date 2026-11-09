import test from 'node:test';
import assert from 'node:assert/strict';
import { validarRespostaDePadrao, resumirAlertasDePadrao, filtrarAlertasDePadrao } from '../src/utils/patternAlerts.js';
const a = {id:'ciclo-123', regra:'ciclo_72h', titulo:'Ciclo', descricao:'Observação', nivel:'alto', conta_principal:'São Paulo', contas:['São Paulo','B','C'],transacoes_ids:['1','2','3'], valor_relacionado:150,quantidade_evidencias:3,moeda:'USD'};
const b = {...a, id:'dispersao-456', regra:'dispersao_24h',nivel:'medio',conta_principal:'X',contas:['X','Y']};
const valid = { dataset:'ibm-aml-hi-small',moeda:'USD',disponivel:true,transacoes_analisadas:20,alertas:[a,b]};
test('Aceita o contrato esperado da API IBM',()=>assert.equal(validarRespostaDePadrao(valid),true));
test('Rejeita moeda incorreta e ausência de status',()=>{
  assert.equal(validarRespostaDePadrao({...valid,moeda:'BRL'}),false);
  assert.equal(validarRespostaDePadrao({...valid,disponivel:undefined}),false);
});
test('Rejeita indicadores sem evidências e dados incompletos',()=>{
  assert.equal(validarRespostaDePadrao({...valid,alertas:[{...a,transacoes_ids:undefined}]}),false);
  assert.equal(validarRespostaDePadrao({...valid,alertas:[{...a,regra:'inventada'}]}),false);
});
test('Conta por prioridade',()=>assert.deepEqual(resumirAlertasDePadrao([a,b]),{total:2,altos:1,medios:1}));
test('Busca sem acento e filtros de regra/prioridade',()=>{
  assert.deepEqual(filtrarAlertasDePadrao([a,b],{busca:'sao paulo'}).map(a=>a.id),['ciclo-123']);
  assert.deepEqual(filtrarAlertasDePadrao([a,b],{nivel:'medio'}).map(a=>a.id),['dispersao-456']);
  assert.deepEqual(filtrarAlertasDePadrao([a,b],{tipo:'ciclo_72h'}).map(a=>a.id),['ciclo-123']);
});
