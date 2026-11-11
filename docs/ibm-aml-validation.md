# Validar IBM AML-Data — importador, PostgreSQL e endpoints

**Escopo:** validação do código de integração. Não significa que o CSV oficial já tenha sido baixado, nem que a amostra esteja publicada no Render/Neon.

## 1. Testes offline (seguros, sem banco)

Na raiz do repositório, após instalar as dependências do backend:

```bash
PYTHONPATH=backend python -m unittest discover -s backend/tests -p 'test_ibm_aml*.py' -v
```

Isso testa parsing do CSV, amostragem reproduzível, paginação, contratos da API, restrição a USD, proibição de rótulos de ground truth nas respostas e validação de leitura. A checagem PostgreSQL é **ignorada (skip)** se a variável de ambiente específica não estiver presente.

## 2. Integração real com PostgreSQL de TESTE (opt-in)

Prepare **um PostgreSQL local** e um banco com nome terminado em `_test` (ex.: `nexuslens_test`), com as permissões necessárias para criar schemas. Exemplo de Docker opcional:

```bash
docker run --rm -d --name nexuslens-ibm-test -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=local-test-only -e POSTGRES_DB=nexuslens_test -p 127.0.0.1:55432:5432 postgres:16
```

No Linux/macOS:

```bash
export NEXUSLENS_TEST_DATABASE_URL=postgresql://postgres:local-test-only@127.0.0.1:55432/nexuslens_test
PYTHONPATH=backend python -m unittest discover -s backend/tests -p 'test_ibm_aml_postgres.py' -v
```

No PowerShell:

```powershell
$env:NEXUSLENS_TEST_DATABASE_URL = 'postgresql://postgres:local-test-only@127.0.0.1:55432/nexuslens_test'
$env:PYTHONPATH = 'backend'
python -m unittest discover -s backend/tests -p 'test_ibm_aml_postgres.py' -v
```

O teste **recusa** URLs remotas e bancos sem sufixo `_test`. Cria um schema aleatório temporário, importa um **CSV de teste artificial** usando o mesmo importador da IBM, exercita FastAPI/SQLAlchemy e remove esse schema ao terminar. Não usa o Neon/Render nem modifica as tabelas legadas.

> Não confunda um `skip` com teste PostgreSQL aprovado. Ele só estará validado de fato quando executado com um servidor PostgreSQL de teste acessível.

## 3. Verificar uma API já publicada (somente GET)

```bash
python backend/scripts/check_ibm_aml_api.py --base-url http://127.0.0.1:8000
```

Substitua por uma URL HTTPS da API de prévia, após implantação. Códigos de saída: `0` dataset disponível e consistente; `2` ainda não importado; `1` falha/inconsistência. A checagem não importa dados e não grava no banco.

## 4. Falta para ter dados visíveis no NexusLens

1. Baixar `HI-Small_Trans.csv` na [origem da IBM](https://github.com/IBM/AML-Data), mantendo o CSV fora do Git.
2. Executar o importador com *dry-run*, conferir o relatório e aprovar a importação em PostgreSQL de **desenvolvimento**.
3. Testar os endpoints e as páginas que dependem do dataset IBM, além do Nexus AI.
4. Só após revisão, aprovar aplicação ao banco de produção e implantação Render/Vercel.

O dataset IBM é **100% sintético**, com licença de dados distinta da licença do código.

## Diagnóstico Neon — 11/11/2026 (consulta somente leitura)

Foi feita uma conferência direta no projeto **nexuslens** do Neon, sem executar escrita ou importação:

| Branch Neon | Tabelas IBM | Registros verificados |
| --- | --- | --- |
| `dev-ibm-aml` | `ibm_aml_accounts` e `ibm_aml_transactions` presentes | **0 contas e 0 transações** |
| `production` | Tabelas IBM ausentes | Não há tabelas IBM para consultar |

Na branch de desenvolvimento, as tabelas contêm as colunas, chaves e índices necessários à estrutura de importação, mas **o esquema vazio não é uma importação validada**. Esta é uma observação pontual na data acima e pode mudar após operações futuras.

**Próxima sequência:** obter e validar o CSV oficial fora do Git; executar o `dry-run`; revisar amostra e confirmar permissão para importar **somente em desenvolvimento**; testar endpoints e telas; solicitar autorização específica antes de qualquer migração/importação no Neon de produção. Commits, PRs e deploys não devem importar dados automaticamente.
