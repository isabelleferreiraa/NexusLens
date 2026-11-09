# NexusLens 2.0 — Acompanhamento local de investigações (modo demonstrativo)

**Contexto:** os dados IBM AML-Data são sintéticos. O arquivo `HI-Small_Trans.csv` precisa estar importado e acessível pela API para que novos sinais apareçam.

## O que foi implementado

- `GET /datasets/ibm-aml/alertas` continua sendo a única fonte de sinais. Nenhum sinal é fabricado pelo navegador.
- A ação **Abrir caso** cria um registro local a partir de um sinal da API, apenas após clique explícito. Não cria duplicatas para o mesmo identificador.
- **Kanban de acompanhamento** com três situações: `Aberto`, `Em análise`, `Concluído`. Permite arrastar cartões na área de trabalho ou mudar a situação por um `<select>` acessível.
- **Tabela de casos** com busca, filtro por situação e acesso aos detalhes.
- **Painel lateral** com evidências, valores USD, observações limitadas a 800 caracteres, data da abertura e histórico das mudanças de situação/observação.
- Os casos continuam visíveis neste navegador mesmo quando a API estiver indisponível; nesses casos, o painel usa a evidência congelada no momento da abertura e informa que o sinal não está no recorte atual.
- Erros de gravação no navegador são comunicados claramente; o sistema não mostra sucesso se não conseguir salvar.

## Armazenamento e segurança

**Provisório e restrito a demonstração acadêmica:** os casos são gravados em `localStorage` sob a chave `nexuslens.ibm-local-cases.v1` no navegador que abriu o caso. Não há autenticação, autorização por usuário, sincronização com PostgreSQL, controle de acesso, auditoria em servidor ou backup automático. Limite de 100 casos por navegador. Limpar dados do site pode apagar os registros locais.

**Não utilizar com dados reais de pessoas, senhas ou documentos sensíveis.** Estes sinais e contas pertencem ao conjunto sintético IBM. O rótulo `Is Laundering` não é consultado pelo frontend nem usado como conclusão investigativa.

Para compartilhar casos entre computadores ou permitir uso operacional, será necessário um backend com autenticação, permissões e trilha de auditoria durável. Não expor endpoints de escrita sem autorização.

## Arquivos

- `frontend/src/pages/InvestigationsPage.jsx`: Kanban, tabela, fila de sinais e painel de acompanhamento.
- `frontend/src/utils/localCases.js`: operações puras de abertura, mudança de status, observações, histórico, validação e armazenamento local.
- `frontend/src/styles/investigations.css`: estilo da nova seção.
- `frontend/tests/localCases.test.mjs`: testes do fluxo local.

## Testes

```
cd frontend
node --test tests/investigations.test.mjs tests/localCases.test.mjs
npm ci
npm run lint
npm run build
```

Os testes de lógica não substituem um teste de build nem a validação do frontend com a API real. O dataset IBM ainda precisa ser importado no PostgreSQL e o Render verificado antes de considerar a plataforma plenamente operacional.
