const str = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const regras = new Set(['ida_volta_24h', 'dispersao_24h', 'ciclo_72h']);
export function validarRespostaDePadrao(resp) {
  if (!resp || resp.dataset !== 'ibm-aml-hi-small' || resp.moeda !== 'USD' || typeof resp.disponivel !== 'boolean' || !Array.isArray(resp.alertas)) return false;
  if (resp.disponivel && (!Number.isInteger(resp.transacoes_analisadas) || resp.transacoes_analisadas < 0)) return false;
  return resp.alertas.every(a => a && typeof a.id === 'string' && regras.has(a.regra) && ['alto','medio'].includes(a.nivel) &&
    typeof a.titulo === 'string' && typeof a.descricao === 'string' && Array.isArray(a.contas) && Array.isArray(a.transacoes_ids) &&
    Number.isFinite(a.valor_relacionado) && a.moeda === 'USD' && Number.isInteger(a.quantidade_evidencias));
}
export function resumirAlertasDePadrao(alertas = []) {
  return {total: alertas.length, altos: alertas.filter(a=>a.nivel === 'alto').length, medios: alertas.filter(a=>a.nivel === 'medio').length};
}
export function filtrarAlertasDePadrao(alertas = [], {busca='', tipo='todos', nivel='todos'}={}) {
  const termo = str(busca).trim();
  return alertas.filter(a => (tipo === 'todos' || a.regra === tipo) && (nivel === 'todos' || a.nivel === nivel) &&
    (!termo || [a.id,a.titulo,a.conta_principal,...a.contas].some(x=>str(x).includes(termo))));
}
