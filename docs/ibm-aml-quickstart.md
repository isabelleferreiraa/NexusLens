# IBM AML-Data — colocar a amostra no NexusLens

**Não há validação documentada de que a amostra foi importada no PostgreSQL de produção.** O download não acontece durante um deploy da Vercel ou do Render: ele deve ser feito em máquina com espaço disponível e acesso à internet. O dataset é **totalmente sintético** e não contém transações reais.

## Caminho rápido (desenvolvimento, sem alterar a produção)

A partir da raiz do repositório, baixe o arquivo de ~476 MB para `data/raw/ibm_aml/` (pasta ignorada pelo Git):

```bash
python backend/scripts/download_ibm_aml.py
```

O script usa um [espelho público no Hugging Face](https://huggingface.co/datasets/OsamaMIT/IBM-AML-HI/tree/main) e verifica tamanho e SHA-256 antes de aceitar o arquivo. A [origem primária](https://github.com/IBM/AML-Data) e o [dataset no Kaggle](https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml) continuam sendo as referências. Se preferir baixar manualmente do Kaggle, coloque `HI-Small_Trans.csv` no mesmo caminho. O script **não baixa nada se o arquivo estiver lá mas não corresponder ao checksum**; nesse caso, investigue a origem antes de substituir.

Confirme a seleção que será importada (**dry run**, sem conexão ao banco):

```bash
python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv
```

Configure **uma conexão PostgreSQL de desenvolvimento**, nunca o Neon de produção nesta etapa. Com backup feito e permissão explícita para importar no banco de desenvolvimento, execute:

```bash
python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv --apply
```

O importador cria e preenche apenas `ibm_aml_accounts` e `ibm_aml_transactions`. O banco anterior permanece intacto. Teste os endpoints:

```bash
python backend/scripts/check_ibm_aml_api.py --base-url http://localhost:8000
```

**Não misture diferentes moedas**: a amostra importada atualmente seleciona somente `US Dollar` e a API a apresenta como `USD`. Os rótulos do simulador nunca são tratados como alertas produzidos pelo NexusLens.

## Para publicar

Depois de validar os registros em desenvolvimento, é necessário autorização para importar uma amostra no PostgreSQL conectado ao Render, confirmar `/datasets/ibm-aml/status`, `/transacoes`, `/grafo` e `/alertas`, e só então considerar a PR pronta para mesclar na `main`. O código de download não faz nada automaticamente nem é acionado no deploy. **A integração do código já foi mesclada à branch principal; a importação e validação dos dados no ambiente publicado continuam etapas independentes e exigem aprovação.**

Os dados IBM são publicados sob **CDLA-Sharing-1.0**, diferente da licença do código do projeto. Não versione o CSV bruto.
