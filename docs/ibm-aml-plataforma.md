# NexusLens 2.0 — IBM AML-Data como fonte principal

**Estado atual:** integração de código IBM e páginas do NexusLens 2.0 incluídas na branch principal. A existência dos dados IBM no banco de produção **não foi verificada** por este documento.

## Decisão de produto

O IBM AML-Data HI-Small passa a ser a **única fonte exposta pela interface**. Não há seletor e **não existe fallback silencioso** para o banco demonstrativo anterior. Os registros antigos podem permanecer no banco como backup técnico, mas não entram nas análises do NexusLens 2.0.

- **Visão Geral:** `/datasets/ibm-aml/grafo`, indicadores referentes a um **recorte** de até 1.500 transações.
- **Transações:** `/datasets/ibm-aml/transacoes`, com paginação de até 200 transações, datas, tipo, contas e valores explicitamente em **USD**. Filtros e ordenação atuam sobre a página atual.
- **Rede Financeira:** grafo com bolinhas azuis arrastáveis, dados e classificação produzidos pela API IBM e volume em **USD**.
- **Alertas:** sinais gerados por regras sobre padrões de movimentação; não são conclusões de fraude nem rótulos de lavagem do simulador. Não são persistidos no servidor.
- **Nexus AI:** usa as métricas retornadas pelo grafo IBM e envia esses números para o endpoint de relatório `/relatorio`. O **Gemini apenas escreve o parecer**; não identifica contas nem executa investigações.
- **Relatórios, Investigações e Configurações:** telas implementadas; casos, pareceres e preferências ficam neste navegador, sem autenticação ou sincronização no servidor.

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
- Persistência autenticada em servidor, auditoria e avaliação independente das heurísticas continuam pendentes.
- Para avaliar algoritmos com os rótulos IBM, separar um conjunto de teste não enriquecido e sem vazamento dos rótulos para as heurísticas.


## Verificações adicionadas ao fechamento da integração

- **Fonte única:** a interface utiliza apenas `/datasets/ibm-aml/*`, sem fallback para `/grafo` e `/transacoes` demonstrativos.
- **Contrato da rede:** a interface verifica que o payload identifica a IBM, é sintético, está em USD, possui contas e arestas consistentes e métricas calculadas. Respostas incompletas geram estado de erro, nunca dados fictícios.
- **Score estrutural:** foram alinhadas as categorias `Elevada`/`Moderada` do serviço de risco com os pesos de conexões do score. Os pesos são heurísticos e não correspondem à probabilidade de lavagem.
- **Gemini:** Nexus AI envia somente classificação, score e métricas agregadas para `/relatorio`. Contas, transações e rótulos do simulador ficam fora do pedido.
- **Paginação:** as transações IBM são listadas até 200 por página e os filtros/ordenação são locais à página atual.
- **Validação manual:** veja `docs/ibm-aml-validation.md`. A checagem real com PostgreSQL só é considerada concluída após rodar a suíte opt-in em banco local de teste.

**Importante:** este commit fecha a integração de código, **não comprova que o CSV oficial já foi importado no Neon/Render**. A interface exibirá um aviso de indisponibilidade até que uma amostra IBM seja importada e a API seja publicada com a autorização da pessoa responsável pelo ambiente.
