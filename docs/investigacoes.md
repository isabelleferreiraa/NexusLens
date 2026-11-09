# NexusLens 2.0 — Investigações (triagem exploratória)

Esta etapa adiciona a página `/investigacoes` no React, consumindo **somente** o endpoint `GET /datasets/ibm-aml/alertas`. A página tem tabela, quadro por prioridade e painel de evidências, com filtros por conta, transação, padrão e nível.

**Limitações explícitas:** os dados IBM são sintéticos; as regras apenas indicam sinais heurísticos. Nenhum caso é criado, persistido ou atribuído a um responsável. O quadro organiza por **prioridade**, não por situação do processo; nenhuma ação marca uma investigação como concluída. Não há fallback para dados inventados quando o CSV não está importado.

## Arquivos da proposta

- `frontend/src/App.jsx` — rota existente de Investigações passa a renderizar a página.
- `frontend/src/pages/InvestigationsPage.jsx` — carregamento, filtros, tabela, quadro e painel lateral.
- `frontend/src/styles/investigations.css` — identidade grafite e azul acinzentado.
- `frontend/src/utils/investigations.js` — fila filtrada e contagens sem persistência falsa.
- `frontend/tests/investigations.test.mjs` — testes da priorização, busca e contagens.

## Testes

Na raiz de `frontend`, rode `node --test tests/investigations.test.mjs`. Quando aplicar no repositório completo, também execute `npm ci`, `npm run lint` e `npm run build`.

## Evolução futura

Para ter cadastro de casos, responsáveis, status e Kanban de acompanhamento, criar tabelas de investigações e trilha de auditoria no PostgreSQL, com autenticação e regras de acesso. Essa etapa exige desenho cuidadoso antes de permitir mutações de dados pela internet.
