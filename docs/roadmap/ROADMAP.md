# Roadmap — NexusLens

Este roadmap separa **código implementado** de **integração validada em ambiente real**. O NexusLens é demonstrativo e usa dados IBM AML-Data sintéticos.

## NexusLens 2.0 — código implementado

- [x] IBM AML-Data HI-Small definido como fonte única da interface, sem fallback para a base legada.
- [x] API de leitura para status, transações paginadas e grafo IBM.
- [x] Regras de identificação de padrões e página de Alertas.
- [x] Visão geral, Transações e Rede Financeira com dados IBM em USD.
- [x] Investigações com Kanban, observações e histórico **local no navegador**.
- [x] Nexus AI com pareceres Gemini baseados em métricas agregadas.
- [x] Página de Relatórios com histórico **local** e impressão / Salvar como PDF.
- [x] Página de Configurações e preferências locais.
- [x] Ajustes incrementais de responsividade nas telas principais.
- [x] Testes unitários para algumas regras, contratos e fluxos locais.

**Importante:** a lista acima confirma implementação de código, não aprovação de um pipeline completo nem operação com dados em produção.

## Validação antes de considerar a versão operacional

- [ ] Confirmar download e integridade do CSV IBM fora do Git.
- [ ] Validar dry-run e importar amostra em PostgreSQL **de desenvolvimento**, após aprovação.
- [ ] Conferir status, transações, grafo e alertas contra registros importados.
- [ ] Testar Nexus AI com chave Gemini de desenvolvimento e mensagens de falha.
- [ ] Executar testes completos de frontend/backend, lint e build no ambiente configurado.
- [ ] Validar visual e navegação por teclado em desktop e celular.
- [ ] Avaliar, aprovar e executar separadamente a importação no PostgreSQL ligado ao Render/Neon.
- [ ] Confirmar funcionamento e dados sintéticos no deploy Vercel + Render.

## Evoluções futuras

- [ ] Autenticação e autorização com separação de usuários.
- [ ] Persistência de investigações e relatórios no servidor, com auditoria.
- [ ] Monitoramento e observabilidade dos serviços.
- [ ] Testes automatizados end-to-end e acessibilidade.
- [ ] Filtros globais, paginação no servidor e análises de volumes maiores.
- [ ] Avaliação formal das heurísticas, separada dos rótulos do simulador.
- [ ] Exportação PDF gerada pelo serviço, se necessária (atualmente usa impressão).
