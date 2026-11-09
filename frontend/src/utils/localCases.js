/**
 * Provisional demo-only case management: stored in this browser, not on the server.
 * Never use this for real customer records, credentials, or sensitive investigations.
 */
export const LOCAL_CASES_KEY = 'nexuslens.ibm-local-cases.v1';
export const CASE_STATUSES = Object.freeze({
  aberto: 'Aberto',
  em_analise: 'Em análise',
  concluido: 'Concluído',
});

const statuses = new Set(Object.keys(CASE_STATUSES));
const maxCases = 100;
const maxNoteLength = 800;
const maxHistory = 40;
const patternIds = new Set(['ida_volta_24h', 'dispersao_24h', 'ciclo_72h']);
const asString = (value) => String(value ?? '');

function validSignal(signal) {
  return Boolean(signal && typeof signal.id === 'string' && signal.id.length <= 128 &&
    patternIds.has(signal.regra) && (signal.nivel === 'alto' || signal.nivel === 'medio') &&
    typeof signal.titulo === 'string' && Array.isArray(signal.contas) &&
    Array.isArray(signal.transacoes_ids) && Number.isFinite(signal.valor_relacionado) &&
    signal.moeda === 'USD');
}

function copySignal(signal) {
  return {
    id: signal.id,
    regra: signal.regra,
    titulo: asString(signal.titulo).slice(0, 150),
    descricao: asString(signal.descricao).slice(0, 600),
    nivel: signal.nivel,
    contas: signal.contas.filter(x => typeof x === 'string').slice(0, 150),
    transacoes_ids: signal.transacoes_ids.filter(x => typeof x === 'string').slice(0, 12),
    quantidade_evidencias: Number.isInteger(signal.quantidade_evidencias) ? signal.quantidade_evidencias : signal.transacoes_ids.length,
    valor_relacionado: signal.valor_relacionado,
    moeda: 'USD',
    inicio: asString(signal.inicio).slice(0, 30),
    fim: asString(signal.fim).slice(0, 30),
    observacao: asString(signal.observacao).slice(0, 400),
  };
}

export function validateCase(item) {
  return Boolean(item && typeof item.id === 'string' && item.id.length <= 144 &&
    typeof item.signalId === 'string' && item.id === `caso:${item.signalId}` &&
    statuses.has(item.status) && validSignal(item.signal) &&
    item.signal.id === item.signalId && typeof item.note === 'string' && item.note.length <= maxNoteLength &&
    typeof item.createdAt === 'string' && typeof item.updatedAt === 'string' &&
    Array.isArray(item.history) && item.history.length <= maxHistory &&
    item.history.every(h => h && statuses.has(h.status) && typeof h.at === 'string' &&
      ['criado', 'status', 'observacao'].includes(h.action)));
}

export function decodeCases(raw) {
  if (raw === null || raw === '') return [];
  const parsed = JSON.parse(raw);
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.cases) ||
      parsed.cases.length > maxCases || !parsed.cases.every(validateCase)) {
    throw new Error('Formato de casos locais inválido');
  }
  return parsed.cases;
}

export function loadLocalCases(storage) {
  if (!storage) return [];
  return decodeCases(storage.getItem(LOCAL_CASES_KEY));
}

export function persistLocalCases(storage, cases) {
  if (!storage) throw new Error('Armazenamento local indisponível');
  if (!Array.isArray(cases) || cases.length > maxCases || !cases.every(validateCase)) {
    throw new Error('Não foi possível validar os casos para salvar');
  }
  storage.setItem(LOCAL_CASES_KEY, JSON.stringify({ version: 1, cases }));
}

export function addLocalCase(cases, signal, at) {
  if (!validSignal(signal)) throw new Error('Sinal IBM inválido');
  const existing = cases.find(item => item.signalId === signal.id);
  if (existing) return cases;
  if (cases.length >= maxCases) throw new Error('Limite de 100 casos locais atingido');
  const item = {
    id: `caso:${signal.id}`,
    signalId: signal.id,
    status: 'aberto',
    signal: copySignal(signal),
    note: '',
    createdAt: at,
    updatedAt: at,
    history: [{ action: 'criado', status: 'aberto', at }],
  };
  if (!validateCase(item)) throw new Error('Sinal não pode ser armazenado');
  return [item, ...cases];
}

export function changeCaseStatus(cases, id, status, at) {
  if (!statuses.has(status)) throw new Error('Status inválido');
  return cases.map(item => {
    if (item.id !== id || item.status === status) return item;
    return {
      ...item, status, updatedAt: at,
      history: [...item.history, { action: 'status', status, at }].slice(-maxHistory),
    };
  });
}

export function updateCaseNote(cases, id, note, at) {
  const normalized = asString(note).trim();
  if (normalized.length > maxNoteLength) throw new Error('A observação deve ter até 800 caracteres');
  return cases.map(item => item.id === id && item.note !== normalized ? {
    ...item, note: normalized, updatedAt: at,
    history: [...item.history, { action: 'observacao', status: item.status, at }].slice(-maxHistory),
  } : item);
}

export function summarizeCases(cases = []) {
  return {
    total: cases.length,
    aberto: cases.filter(c => c.status === 'aberto').length,
    em_analise: cases.filter(c => c.status === 'em_analise').length,
    concluido: cases.filter(c => c.status === 'concluido').length,
  };
}

export function filterCases(cases = [], { search = '', status = 'todos' } = {}) {
  const term = asString(search).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  return cases.filter(c => (status === 'todos' || c.status === status) &&
    (!term || [c.id, c.signalId, c.signal.titulo, c.signal.descricao, c.note,
      ...c.signal.contas, ...c.signal.transacoes_ids].some(s =>
      asString(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').includes(term))))
    .sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}
