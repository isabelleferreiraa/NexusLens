# NexusLens 2.0 — Visão de produto

## Problema que queremos resolver

Quem analisa redes de pagamentos precisa priorizar revisões, entender relações entre contas e registrar evidências de um possível comportamento atípico. Gráficos de conexões isolados não explicam o motivo da prioridade.

## Para quem

Analistas de risco e prevenção a fraudes em uma fintech **fictícia**. O projeto é um laboratório técnico e uma demonstração de produto, não um sistema bancário homologado.

## Fluxo principal do MVP

1. Abrir o dashboard e consultar uma rede de dados sintéticos.
2. Visualizar a quantidade de contas, transações e contas classificadas para revisão.
3. Filtrar a fila por nome e classificação heurística.
4. Selecionar uma conta para destacar suas conexões e inspecionar volume e quantidade de transações relacionadas.
5. Solicitar um parecer em linguagem natural ao Gemini, com ressalva de que toda conclusão requer investigação humana.

## O que não devemos afirmar

- O score não é uma probabilidade calibrada de fraude.
- Ter muitos relacionamentos financeiros ou alta centralidade não comprova fraude.
- Os dados atuais são fictícios; o produto não acessa o Pix, MED ou contas bancárias reais.
- Não há monitoramento em tempo real nem fluxo de gestão de casos persistente nesta fase.

## Etapas seguintes

### 2.1 — Motor de alertas baseado em evidências
- Distinguir **conta**, **transferência** e **alerta**.
- Criar regras testáveis para movimentação atípica (valor, horário, frequência, repetição).
- Exibir para cada alerta o sinal específico, parâmetros e evidências observáveis.
- Avaliar falsos positivos e limites do método.

### 2.2 — Investigação de casos
- Status: novo, em análise, descartado, encaminhado.
- Registro de observações, responsável e histórico de decisões.
- Autenticação e autorização antes de dados de múltiplos usuários.

### 2.3 — Dados e integração
- Upload de CSV com validação e modelo de dados documentado.
- Processar apenas datasets sintéticos ou devidamente anonimizados.
- Tratar dados pessoais conforme políticas de segurança e privacidade.
- Paginação e processamento em lotes para redes maiores.

### 2.4 — Qualidade operacional
- Testes automatizados, contratos de API e CI/CD.
- Estados de carregamento, vazio e erro.
- Monitoramento de serviços, limites de uso da IA e custos.
- Documentação de instalação e deploy que corresponda ao código.

## Design
- Interface escura com cor de destaque violeta; uso consistente de semântica de risco.
- Legendas e números claros, contraste e navegação por teclado.
- Priorizar fila de revisão e contexto da conta; IA é um apoio, não o centro da experiência.
