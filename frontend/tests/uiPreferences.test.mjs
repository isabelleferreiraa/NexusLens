import { strict as assert } from 'node:assert';
import test from 'node:test';
import {
  UI_PREFERENCES_KEY, DEFAULT_UI_PREFERENCES,
  readUiPreferences, saveUiPreferences, interpretIbmStatus,
} from '../src/utils/uiPreferences.js';

function storage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, val) => values.set(key, val),
  };
}

test('sem preferências salvas usa valores padrão', () => {
  assert.deepEqual(readUiPreferences(storage()), DEFAULT_UI_PREFERENCES);
  assert.deepEqual(readUiPreferences(null), DEFAULT_UI_PREFERENCES);
});

test('persiste somente preferências válidas', () => {
  const memory = storage();
  assert.equal(saveUiPreferences(memory, { sidebarCollapsed: true, reduceMotion: true, token: 'ignore' }), true);
  assert.deepEqual(JSON.parse(memory.getItem(UI_PREFERENCES_KEY)), {
    version: 1, preferences: { sidebarCollapsed: true, reduceMotion: true },
  });
  assert.deepEqual(readUiPreferences(memory), { sidebarCollapsed: true, reduceMotion: true });
});

test('não salva configurações malformadas', () => {
  const memory = storage();
  assert.equal(saveUiPreferences(memory, { sidebarCollapsed: 'true', reduceMotion: false }), false);
  assert.equal(memory.getItem(UI_PREFERENCES_KEY), null);
});

test('valores ausentes e JSON inválido não derrubam a interface', () => {
  const memory = storage();
  memory.setItem(UI_PREFERENCES_KEY, '{invalid');
  assert.deepEqual(readUiPreferences(memory), DEFAULT_UI_PREFERENCES);
  memory.setItem(UI_PREFERENCES_KEY, JSON.stringify({ version: 7, preferences: { sidebarCollapsed: true } }));
  assert.deepEqual(readUiPreferences(memory), DEFAULT_UI_PREFERENCES);
});

test('armazenamento indisponível falha de forma segura', () => {
  assert.equal(saveUiPreferences(null, { sidebarCollapsed: true, reduceMotion: false }), false);
  assert.deepEqual(readUiPreferences({ getItem() { throw Error('blocked'); } }), DEFAULT_UI_PREFERENCES);
});

test('interpreta status IBM validado quando há importação', () => {
  assert.deepEqual(interpretIbmStatus({
    dataset: 'ibm-aml-hi-small', dados_sinteticos: true, moeda: 'USD',
    disponivel: true, situacao: 'pronto', total_contas: 220, total_transacoes: 1287,
  }), { available: true, state: 'pronto', accounts: 220, transactions: 1287 });
});

test('status não importado não se confunde com sucesso', () => {
  assert.deepEqual(interpretIbmStatus({
    dataset: 'ibm-aml-hi-small', dados_sinteticos: true, moeda: 'USD',
    disponivel: false, situacao: 'nao_importado', total_contas: 0, total_transacoes: 0,
  }), { available: false, state: 'nao_importado', accounts: 0, transactions: 0 });
});

test('rejeita contrato inválido, moedas e contagens inconsistentes', () => {
  const base = { dataset: 'ibm-aml-hi-small', dados_sinteticos: true,
    moeda: 'USD', disponivel: true, situacao: 'pronto', total_contas: 2, total_transacoes: 3 };
  for(const obj of [{...base, moeda:'BRL'}, {...base, total_transacoes: -1},
    {...base, disponivel:false}, {...base, total_contas:0}, {...base, dados_sinteticos:false},
    {...base, total_transacoes:'3'}, {...base, situacao:'desconhecido'}, {}]) {
    assert.equal(interpretIbmStatus(obj), null);
  }
});
