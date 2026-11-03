const normalizar = (s) => String(s ?? '').trim().toLocaleLowerCase('pt-BR');
export function nivelRisco(valor) {
  const v = normalizar(valor);
  if (v === 'alto') return 'alto';
  if (v === 'medio' || v === 'médio') return 'medio';
  if (v === 'baixo') return 'baixo';
  return 'outros';
}
const idDe = (v) => String(v ?? '').trim();

export function construirModeloGrafo(nos = [], arestas = []) {
  const contas = new Map();
  for (const no of nos) {
    const id = idDe(no.id);
    if (!id || contas.has(id)) continue;
    contas.set(id, {id, nome:no.nome || no.label || 'Conta ' + id.slice(0,8),
      risco:nivelRisco(no.risco ?? no.risk), grau:0, quantidade:0, valor:0,
      possuiValorIndisponivel:false});
  }
  const vizinhos = new Map([...contas.keys()].map(id => [id, new Set()]));
  const conexoes = [];
  for (const [indice, aresta] of arestas.entries()) {
    const source = idDe(aresta.origem ?? aresta.source);
    const target = idDe(aresta.destino ?? aresta.target);
    if (!contas.has(source) || !contas.has(target)) continue;
    const raw = aresta.valor;
    const n = raw === null || raw === undefined || raw === '' ? null : Number(raw);
    const valor = n !== null && Number.isFinite(n) ? n : null;
    const origem = contas.get(source), destino = contas.get(target);
    if (source !== target) {
      vizinhos.get(source).add(target);
      vizinhos.get(target).add(source);
    }
    origem.quantidade++;
    if (source !== target) destino.quantidade++;
    for (const conta of source === target ? [origem] : [origem,destino]) {
      if (valor === null) conta.possuiValorIndisponivel = true;
      else conta.valor += valor;
    }
    conexoes.push({id:String(aresta.id ?? 'ligacao-' + indice),source,target,valor});
  }
  for (const conta of contas.values()) conta.grau = vizinhos.get(conta.id).size;
  const ordenadas = [...contas.values()].sort((a,b) => b.grau-a.grau || a.nome.localeCompare(b.nome,'pt-BR') || a.id.localeCompare(b.id));
  const distribuicao = {alto:0,medio:0,baixo:0,outros:0};
  const modeloNos = ordenadas.map((conta,i) => {
    distribuicao[conta.risco]++;
    if (i === 0) return {...conta,position:{x:0,y:0}};
    let indice = i-1, anel = 1, capacidade = 8;
    while (indice >= capacidade) {indice -= capacidade; anel++; capacidade = anel*8;}
    const angulo = 2*Math.PI*indice/capacidade - Math.PI/2 + (anel%2 ? 0 : Math.PI/capacidade);
    const r = anel*225;
    return {...conta, position:{x:Math.round(Math.cos(angulo)*r),y:Math.round(Math.sin(angulo)*r)}};
  });
  return {nos:modeloNos,arestas:conexoes,distribuicao};
}
export function filtrarModeloGrafo(modelo,risco='todos') {
  const nos = risco==='todos' ? modelo.nos : modelo.nos.filter(no=>no.risco===risco);
  const ids = new Set(nos.map(no=>no.id));
  return {nos,arestas:modelo.arestas.filter(e=>ids.has(e.source)&&ids.has(e.target))};
}
