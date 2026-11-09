# NexusLens 2.0 — Nexus AI e Relatórios

Esta etapa prepara a página `/relatorios` e liga a geração de pareceres do Gemini ao histórico local.

## Escopo

- **IBM AML-Data apenas**: Nexus AI envia ao backend apenas o score, a classificação e métricas agregadas da rede sintética; não envia contas, transações nem rótulos de lavagem do simulador.
- **Geração de relatórios**: o backend valida o payload agregado usando Pydantic (HTTP 422 em dados incompletos) e retorna erro HTTP 503 quando o Gemini falha, sem mascarar falhas como pareceres. O relatório precisa ser um texto não vazio e válido para ser salvo.
- **Histórico local**: cada navegador armazena até 30 pareceres em `localStorage`, com data, classificação, score e contagens da rede. Não é um histórico de banco, não sincroniza entre usuários e pode desaparecer se o usuário limpar os dados do navegador.
- **Relatórios**: tela com busca, listagem, detalhes, remoção confirmada e saída para impressão.
- **PDF**: botão **Imprimir / Salvar em PDF** abre uma página imprimível e usa a opção de impressão do navegador. Não é um download automático do PDF nem depende de biblioteca externa. Em impressoras virtuais, selecione **Salvar como PDF**.
- **Segurança**: conteúdo produzido pelo Gemini é escapado antes de entrar no HTML imprimível. Não há login ou API de escrita.

## Testes

Na raiz do repositório:

```bash
cd frontend && node --test tests/reportHistory.test.mjs
cd ..
python -m unittest discover -s backend/tests -p 'test_ia_service.py' -v
python -m unittest discover -s backend/tests -p 'test_relatorio_schema.py' -v
```

## Pendências

1. Importar a amostra oficial do `HI-Small_Trans.csv` no PostgreSQL e validar no Render (ainda pendente).
2. Validar o endpoint Gemini `/relatorio` com chave válida de desenvolvimento e fluxo de erro.
3. Executar `npm ci`, `npm run lint` e `npm run build` em ambiente com as dependências instaladas. Não foram executados nesta revisão.
4. Em etapa posterior, substituir armazenamento local por histórico persistido e autenticado, com controles de acesso e auditoria.

**Dados sintéticos**: os resultados não comprovam fraude; exigem revisão humana. Não versionar o CSV no GitHub.
