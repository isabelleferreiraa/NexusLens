# NexusLens: sinais transacionais no IBM AML-Data

**Implementação na branch `feat/nexuslens-v2`; implantação e importação de dados ainda pendentes.**

O endpoint `GET /datasets/ibm-aml/alertas?limit=1500&max_eventos=100` consulta apenas registros da amostra IBM já importados no PostgreSQL. É **somente leitura**, limitado a 1.500 transações por consulta e até 100 sinais retornados. O frontend integra um painel de padrões à Central de Alertas, mantendo os sinais estruturais por conta em seção separada.

## Regras demonstrativas (heurísticas, não modelos de fraude)

1. **Ida e volta em 24h**: A→B e B→A na janela de um dia; um evento por par de contas. Prioridade média.
2. **Dispersão em 24h**: uma conta envia valores para pelo menos quatro destinos distintos no mesmo intervalo de 24h. Prioridade média.
3. **Ciclo entre três contas em 72h**: A→B→C→A em ordem cronológica; os três valores têm mínimo de pelo menos 60% do máximo. Prioridade alta para revisão.

A prioridade expressa organização da triagem e **não é probabilidade de crime**. As regras **não leem nem repassam** `is_laundering_label` do dataset e, portanto, não usam a resposta esperada como resultado. Nomes/IDs de contas são referências sintéticas.

## Limites importantes

- O importador atual seleciona uma amostra **enriquecida** com sementes rotuladas; o conjunto não mede prevalência de fraude e não é avaliação estatística válida.
- A análise trabalha apenas com transações em USD e com data válida no recorte. Dados de outras moedas não são convertidos.
- Sinais com transações fora do recorte não aparecem. Uma análise de produção requer histórico completo, revisão de limiares, validação operacional e boas práticas regulatórias.
- A mesma transação pode integrar mais de um padrão. Valores são volume de **movimentações relacionadas**, não montantes necessariamente ilícitos.
- Sem CSV importado, `/alertas` retorna `disponivel: false` e `alertas: []`. Sem backend atualizado, a interface apresenta erro controlado.

## Testes

```bash
python -m unittest discover -s backend/tests -p 'test_ibm_alert_rules.py' -v
python -m unittest discover -s backend/tests -p 'test_ibm_alerts_api.py' -v
cd frontend && node --test tests/patternAlerts.test.mjs
```

Testes offline usam dados artificiais e SQLite. Não equivalem à validação com o CSV oficial ou com o PostgreSQL conectado ao Render.

## Próximos passos antes do merge da PR #16

1. Importar `HI-Small_Trans.csv` num PostgreSQL **de desenvolvimento** e executar a suíte de validação.
2. Testar os endpoints IBM e a interface com a amostra efetivamente importada.
3. Verificar Render e Vercel, especialmente indisponibilidade de dados, paginação e performances dos grafos.
4. Só então marcar a PR #16 como pronta e mesclar na `main`, com aprovação.
