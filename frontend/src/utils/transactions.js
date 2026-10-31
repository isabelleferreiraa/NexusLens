const text = (value) => String(value ?? '').trim();

export function normalizarTransacoes(transacoes = [], nos = []) {
  const nomes = new Map(nos.map((no) => [text(no.id), text(no.nome)]).filter(([, nome]) => nome));
  return transacoes.map((registro, indice) => {
    const origem = text(registro.origem ?? registro.id_cliente_origem);
    const destino = text(registro.destino ?? registro.id_cliente_destino);
    if (!origem || !destino) return null;
    const numero = Number(registro.valor);
    const valor = registro.valor === null || registro.valor === undefined || registro.valor === '' || !Number.isFinite(numero) ? null : numero;
    const identificador = text(registro.id ?? registro.id_transacao) || null;
    const dataBruta = text(registro.data_transacao ?? registro.data);
    const data = /^\d{4}-\d{2}-\d{2}/.test(dataBruta) ? dataBruta : null;
    const tipo = text(registro.tipo_transacao ?? registro.tipo) || null;
    return {
      chave: identificador || `registro-${indice + 1}`,
      identificador, indice: indice + 1, origem, destino,
      nomeOrigem: nomes.get(origem) || null,
      nomeDestino: nomes.get(destino) || null,
      valor, data, tipo,
    };
  }).filter(Boolean);
}

export function resumoTransacoes(transacoes) {
  const contas = new Set();
  let volume = 0;
  let semValor = 0;
  for (const t of transacoes) {
    contas.add(t.origem);
    contas.add(t.destino);
    if (t.valor === null) semValor += 1;
    else volume += t.valor;
  }
  return { total: transacoes.length, contas: contas.size, volume: semValor ? null : volume };
}

export function filtrarTransacoes(transacoes, filtros = {}) {
  const busca = text(filtros.busca).toLocaleLowerCase('pt-BR');
  const min = filtros.min === '' || filtros.min === undefined ? null : Number(filtros.min);
  const max = filtros.max === '' || filtros.max === undefined ? null : Number(filtros.max);
  return transacoes.filter((t) => {
    if (busca && ![t.nomeOrigem, t.nomeDestino, t.origem, t.destino, t.identificador, `registro ${t.indice}`].some((v) => text(v).toLocaleLowerCase('pt-BR').includes(busca))) return false;
    if (min !== null && Number.isFinite(min) && (t.valor === null || t.valor < min)) return false;
    if (max !== null && Number.isFinite(max) && (t.valor === null || t.valor > max)) return false;
    if (filtros.de && (!t.data || t.data.slice(0, 10) < filtros.de)) return false;
    if (filtros.ate && (!t.data || t.data.slice(0, 10) > filtros.ate)) return false;
    return true;
  }).sort((a, b) => {
    if (filtros.ordenacao === 'valor-asc') return (a.valor ?? -Infinity) - (b.valor ?? -Infinity);
    if (filtros.ordenacao === 'recentes') return (b.data || '').localeCompare(a.data || '') || a.indice - b.indice;
    return (b.valor ?? -Infinity) - (a.valor ?? -Infinity);
  });
}

export function formatarMoeda(valor) {
  return typeof valor === 'number' && Number.isFinite(valor)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    : 'Não informado';
}

export function formatarData(data) {
  if (!data) return 'Não informada';
  const match = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Não informada';
}
