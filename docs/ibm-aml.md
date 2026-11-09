# Integração opcional — IBM AML-Data HI-Small

> **Status:** importador preparado, **não aplicado ao banco**, e **ainda não conectado à interface**.

## Fonte e licença

- Fonte oficial: https://github.com/IBM/AML-Data
- Distribuição indicada pelos autores: https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml
- Conjunto escolhido: `HI-Small_Trans.csv` (~476 MB).
- Licença **dos dados**: CDLA-Sharing-1.0. Código e dados não têm necessariamente a mesma licença.
- São dados **100% sintéticos**, não transações bancárias de pessoas reais.
- O indicador `Is Laundering` é o rótulo do simulador: **não** equivale a um alerta produzido pelo NexusLens.

## Por que tabelas separadas?

O NexusLens atual usa UUIDs de clientes e valores apresentados em **BRL**. O conjunto IBM usa pares `From Bank` + `Account` e `To Bank` + `Account`, que não têm o mesmo formato, e suporta várias moedas. Não substituímos ou misturamos os registros atuais.

O importador cria tabelas `ibm_aml_accounts` e `ibm_aml_transactions` de maneira isolada. Preserva datas, tipo de pagamento, moeda e rótulo do simulador, sem atribuir CPF, nomes ou identidade reais a contas sintéticas.

## Preparação

1. Baixe o arquivo `HI-Small_Trans.csv` na origem indicada acima.
2. Guarde-o somente na máquina local (sugestão: `data/raw/ibm_aml/HI-Small_Trans.csv`). **Não faça commit do CSV.**
3. Na raiz do repositório, execute o modo de prévia **sem conectar ao banco**:

```bash
python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv
```

A prévia seleciona até 20 transações rotuladas como lavagem e suas vizinhanças, limitando a seleção a **1.500 transações e 220 contas**. A amostra é enriquecida deliberadamente com casos rotulados; **não** serve para medir taxa de fraude, precisão ou recall na população completa. O arquivo de origem é lido em até duas passagens, sem carregá-lo inteiro na memória.

Para um teste menor:

```bash
python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv --max-transactions 300 --max-accounts 100 --labeled-seeds 8
```

## Importação para banco (somente após autorização e backup)

Nenhum comando faz isso automaticamente. Para habilitar, primeiro configure uma conexão PostgreSQL **de desenvolvimento** com `DATABASE_URL` ou as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. O comando abaixo cria tabelas separadas e insere registros de forma idempotente, sem apagar os dados existentes:

```bash
python backend/scripts/import_ibm_aml.py --csv data/raw/ibm_aml/HI-Small_Trans.csv --apply
```

**Não execute diretamente no Neon/Render de produção antes de aprovar a mudança.**

### Restrições conscientes

- O filtro inicial seleciona apenas transações cuja moeda paga **e** recebida seja `US Dollar`, sem converter moedas ou apresentar USD como BRL.
- Não foram incluídos dados brutos de terceiros no GitHub; qualquer amostra derivada redistribuída deve observar a licença CDLA-Sharing-1.0 e documentação de alterações.
- `--apply` nunca substitui ou remove clientes, transações ou relatórios existentes.
- Uma importação em PostgreSQL ainda não deixa os dados visíveis no frontend. O próximo passo é implementar uma API de leitura do conjunto IBM e um seletor de fonte de dados no React.
- Para uma avaliação científica de detecção, usar um conjunto de teste **separado e não enriquecido**, com separação temporal ou por entidades, evitando vazamento de rótulos.

## Testes

```bash
python -m unittest discover -s backend/tests -p 'test_ibm_aml_import.py' -v
```
