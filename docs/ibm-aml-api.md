# IBM AML-Data — leitura isolada da API

**Status:** código preparado para revisão, ainda não publicado ou conectado ao frontend.

A integração adiciona três endpoints REST opcionais, sem modificar os já existentes:

| Método | Endpoint | Função |
|---|---|---|
| `GET` | `/datasets/ibm-aml/status` | Mostra se as tabelas foram importadas e quantos registros existem. Não cria tabelas. |
| `GET` | `/datasets/ibm-aml/transacoes?limit=100&offset=0` | Lista até 200 transações por página. Ordenação estável por data/ID. |
| `GET` | `/datasets/ibm-aml/grafo?limit=1500` | Grafo de até 1.500 transações com métricas e classificações calculadas pelo NexusLens. |

## Proteções importantes

- As consultas são **somente leitura**; não executam importação, `INSERT`, `DELETE` ou alterações do esquema.
- Se o dataset ainda não existir no PostgreSQL, os endpoints informam `disponivel: false`, `situacao: nao_importado` e retornam listas vazias, em vez de dados inventados.
- Os campos `is_laundering_label` **não são lidos nem enviados** à interface. Eles representam rótulos da simulação IBM, não detecções do NexusLens.
- A moeda é explicitamente identificada como **USD** (`moeda: "USD"`). **Não exibir os valores como BRL** no frontend.
- Os nomes de contas são fictícios e abreviados, sem identificação de pessoas reais.
- Limites de 1.500 transações por grafo e 200 por página protegem o navegador e o backend.
- O grafo apresenta `quantidade_arestas` como número de pares dirigidos únicos; `transacoes_no_recorte` é a quantidade de lançamentos. Relações repetidas podem ter mais de uma transação.
- Para proteger o projeto atual, `/grafo`, `/transacoes`, `/clientes` e `/relatorio` **não são alterados**.
- Classificações atuais são **heurísticas** e não comprovam fraude. Para análise científica, usar amostra não enriquecida e avaliação separada, conforme `docs/ibm-aml.md`.

## Antes de colocar no ar

1. Revisar/aprovar o código e registrar o commit na `feat/nexuslens-v2`.
2. Instalar dependências do backend e testar as rotas localmente.
3. **Em ambiente de desenvolvimento**, importar uma amostra do `HI-Small_Trans.csv` após aprovação (documentado em `docs/ibm-aml.md`).
4. Testar `GET /datasets/ibm-aml/status`, depois as transações e o grafo.
5. Em outro commit, construir o **seletor de fonte de dados** no React, incluindo moeda correta e estados de dataset indisponível.
6. Somente depois avaliar implantação no Render/Neon de produção e mesclagem na `main`, sempre com autorização explícita.

## Testes automatizados

```bash
python -m unittest discover -s backend/tests -p 'test_ibm_aml_api.py' -v
```

Usam SQLite em memória com registros artificiais; nenhuma conexão é feita ao banco real.
