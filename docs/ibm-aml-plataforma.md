# NexusLens 2.0 — IBM AML-Data como fonte principal

**Estado desta alteração:** código de frontend preparado para revisão. Não foi enviado ao GitHub, nem publicado no Render/Vercel. O conjunto de dados ainda não foi importado no PostgreSQL.

## Decisão de produto

O IBM AML-Data HI-Small passa a ser a **única fonte exposta pela interface**. Não há seletor e **não existe fallback silencioso** para o banco demonstrativo anterior. Os registros antigos podem permanecer no banco como backup técnico, mas não entram nas análises do NexusLens 2.0.

- **Visão Geral:** `/datasets/ibm-aml/grafo`, indicadores referentes a um **recorte** de até 1.500 transações.
- **Transações:** `/datasets/ibm-aml/transacoes`, com paginação de até 200 transações, datas, tipo, contas e valores explicitamente em **USD**. Filtros e ordenação atuam sobre a página atual.
- **Rede Financeira:** grafo com bolinhas azuis arrastáveis, dados e classificação produzidos pela API IBM e volume em **USD**.
- **Alertas:** conta classificada como alta ou média pelas heurísticas do NexusLens, **não** pelo rótulo de lavagem do simulador. Ainda não há alertas independentes persistidos.
- **Nexus AI:** usa as métricas retornadas pelo grafo IBM e envia esses números para o endpoint de relatório `/relatorio`. O **Gemini apenas escreve o parecer**; não identifica contas nem executa investigações.
- **Relatórios, Investigações e Configurações:** ainda são páginas planejadas; quando implementadas, deverão usar o mesmo contexto IBM. Não afirmar que já estão prontas.

## Dados sintéticos e licença

O conjunto IBM é **inteiramente sintético** (não anonimizado de transações reais). Fonte: https://github.com/IBM/AML-Data e https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml . Os **dados** usam CDLA-Sharing-1.0, independentemente da licença do código.

Amostras são demonstrativas e, pelo importador atual, enriquecidas com transações rotuladas. **Não** se deve inferir prevalência real de lavagem ou precisão de detecção a partir delas.

## Para utilizar os registros efetivamente

1. Obtenha o arquivo original `HI-Small_Trans.csv` da fonte IBM/Kaggle e armazene em `data/raw/ibm_aml/HI-Small_Trans.csv` na máquina local. Os dados brutos estão no `.gitignore`; não faça commit do CSV de centenas de megabytes.
2. Prepare um PostgreSQL **de desenvolvimento** (não o Neon de produção) e configure `DATABASE_URL` ou `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` no ambiente. Não cole credenciais em arquivos versionados.
3. Rode a seleção em modo **dry-run** na raiz do repositório:

   ```bash
   python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv
   ```

4. Confira os quantitativos, a moeda USD e se a amostra atende aos limites. Após um backup e aprovação para o **banco de desenvolvimento**, rode a importação:

   ```bash
   python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv --apply
   ```

   Esse comando atua apenas nas tabelas `ibm_aml_accounts` e `ibm_aml_transactions`.

5. Inicie o backend da branch que já contém os endpoints IBM. Teste nesta ordem:

   - `GET /datasets/ibm-aml/status` → `disponivel: true`, `moeda: "USD"`, totais não nulos.
   - `GET /datasets/ibm-aml/transacoes?limit=10&offset=0` → transações com moeda USD.
   - `GET /datasets/ibm-aml/grafo?limit=200` → contas, arestas e métricas sem rótulos `Is Laundering`.

6. No frontend, rode `npm ci`, `npm run lint`, `npm run build`, `npm run dev`. A API é acessada pelo proxy `/api` já existente.
7. Somente depois da validação em desenvolvimento, solicitar autorização para importar no PostgreSQL conectado ao Render e integrar a branch à `main`. Não executar importação de produção automaticamente.

**Se o CSV não estiver importado:** Visão Geral, Transações, Rede Financeira, Alertas e Nexus AI mostram estado de indisponibilidade/erro, sem números falsos ou fallback para a base antiga.

## Limitações conhecidas

- API retorna recorte limitado para não sobrecarregar o Render e o navegador, não a totalidade do HI-Small. Seu score é **do recorte**.
- Conexões repetidas podem gerar várias transações, embora métricas de grafo usem relações dirigidas únicas.
- O frontend ainda não possui filtros de busca globais no servidor para as transações; filtros atuam por página.
- A evolução das regras de detecção, Investigações e Histórico de Relatórios continua pendente.
- Para avaliar algoritmos com os rótulos IBM, separar um conjunto de teste não enriquecido e sem vazamento dos rótulos para as heurísticas.
