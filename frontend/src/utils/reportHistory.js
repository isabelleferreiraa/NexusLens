/** Local report history: synthetic IBM aggregate metrics only, never raw transactions. */
export const REPORTS_KEY = 'nexuslens:ibm-reports:v1';
export const MAX_REPORTS = 30;
const MAX_REPORT_LENGTH = 16000;

const goodDate = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));

export function validateReportRecord(value) {
  return Boolean(value && typeof value === 'object' &&
    value.dataset === 'ibm-aml-hi-small' && value.moeda === 'USD' && value.dados_sinteticos === true &&
    typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 100 &&
    goodDate(value.criado_em) &&
    typeof value.relatorio === 'string' && value.relatorio.trim().length > 0 && value.relatorio.length <= MAX_REPORT_LENGTH &&
    Number.isFinite(value.score_risco) && value.score_risco >= 0 && value.score_risco <= 100 &&
    typeof value.classificacao === 'string' && value.classificacao.length > 0 && value.classificacao.length <= 80 &&
    Number.isInteger(value.contas) && value.contas >= 0 &&
    Number.isInteger(value.relacoes) && value.relacoes >= 0);
}

export function createReportRecord({ id, criado_em, relatorio, payload }) {
  const record = {
    id, criado_em, relatorio: String(relatorio ?? '').trim(),
    dataset: 'ibm-aml-hi-small', moeda: 'USD', dados_sinteticos: true,
    score_risco: payload?.score_risco, classificacao: payload?.classificacao,
    contas: payload?.metricas?.quantidade_nos, relacoes: payload?.metricas?.quantidade_arestas,
  };
  return validateReportRecord(record) ? record : null;
}

export function readReportHistory(storage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(REPORTS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validateReportRecord)
      .sort((a,b) => Date.parse(b.criado_em) - Date.parse(a.criado_em))
      .slice(0, MAX_REPORTS);
  } catch { return []; }
}

export function saveReportHistory(storage, record) {
  if (!storage || !validateReportRecord(record)) return { ok: false, records: readReportHistory(storage) };
  const old = readReportHistory(storage);
  const records = [record, ...old.filter(r => r.id !== record.id)]
    .sort((a,b) => Date.parse(b.criado_em) - Date.parse(a.criado_em))
    .slice(0,MAX_REPORTS);
  try {
    storage.setItem(REPORTS_KEY, JSON.stringify(records));
    return { ok: true, records };
  } catch { return { ok: false, records: old }; }
}

export function removeReportHistory(storage, id) {
  if (!storage) return { ok: false, records: [] };
  const old = readReportHistory(storage);
  const records = old.filter(r => r.id !== id);
  if (old.length === records.length) return { ok: false, records: old };
  try {
    storage.setItem(REPORTS_KEY, JSON.stringify(records));
    return { ok: true, records };
  } catch { return { ok: false, records: old }; }
}

function html(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
export function printableReportHtml(report) {
  if (!validateReportRecord(report)) return null;
  const ts = new Date(report.criado_em).toLocaleString('pt-BR');
  const body = report.relatorio.split(/\r?\n/).filter(s=>s.trim())
    .map(p=>`<p>${html(p)}</p>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>NexusLens - Relatório IBM AML</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  @page{size:A4;margin:20mm}body{font-family:Arial,sans-serif;color:#283c4d;line-height:1.65;font-size:12pt;max-width:780px;margin:32px auto;padding:0 18px}
  .brand{font-weight:800;font-size:20pt;letter-spacing:-.6px}.brand span{color:#62839a}.label{font-size:9pt;color:#718798;letter-spacing:1px;text-transform:uppercase}
  h1{font-size:21pt;margin:24px 0 8px}.meta{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}.metric{border:1px solid #dce5ec;border-radius:8px;padding:10px 15px;min-width:115px}.metric b{display:block;font-size:16pt}
  .body{border-top:2px solid #d4e1ea;padding-top:20px;overflow-wrap:anywhere;white-space:normal}.body p{margin:0 0 14px}.notice{border-left:3px solid #8eacbf;background:#f1f6f9;padding:12px 14px;font-size:9pt;color:#637f90;margin-top:25px}
  @media print{body{margin:0;max-width:none;padding:0}.no-print{display:none}}
  </style></head><body><div class="brand">Nexus<span>Lens</span></div><div class="label">Inteligência financeira · Relatório IBM AML-Data</div>
  <h1>Parecer assistido por IA</h1><p class="label">Gerado em ${html(ts)} · Dados sintéticos · USD</p>
  <div class="meta"><div class="metric">Score estrutural<b>${report.score_risco}/100</b></div><div class="metric">Classificação<b>${html(report.classificacao)}</b></div><div class="metric">Contas<b>${report.contas}</b></div><div class="metric">Relações<b>${report.relacoes}</b></div></div>
  <section class="body">${body}</section><p class="notice">Análise heurística de um recorte sintético IBM AML-Data. O Gemini apenas redige o parecer a partir de métricas agregadas. Este documento não comprova irregularidade e requer revisão humana.</p>
  <p class="no-print"><button id="nl-print-button">Imprimir / Salvar como PDF</button> · No diálogo, escolha “Salvar como PDF”.</p></body></html>`;
}
