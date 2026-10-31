export const pages = {
  overview: { path: '/', title: 'Visão geral', subtitle: 'Indicadores da rede financeira.' },
  transactions: { path: '/transacoes', title: 'Transações', subtitle: 'Movimentações e transferências.' },
  alerts: { path: '/alertas', title: 'Alertas', subtitle: 'Movimentações que merecem revisão.' },
  network: { path: '/rede-financeira', title: 'Rede financeira', subtitle: 'Grafo interativo e métricas estruturais.' },
  cases: { path: '/investigacoes', title: 'Investigações', subtitle: 'Evidências e acompanhamento de casos.' },
  ai: { path: '/nexus-ai', title: 'Nexus AI', subtitle: 'Pareceres sobre as métricas da rede.' },
  reports: { path: '/relatorios', title: 'Relatórios', subtitle: 'Histórico dos pareceres gerados.' },
  settings: { path: '/configuracoes', title: 'Configurações', subtitle: 'Preferências da plataforma.' },
};

export function pageFromPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return Object.keys(pages).find((key) => pages[key].path === path) || 'notFound';
}
