# NexusLens 2.0

**Plataforma demonstrativa de análise de redes financeiras, padrões de movimentação e apoio à triagem com grafos e IA.**

O NexusLens combina **React**, **FastAPI**, **PostgreSQL**, **NetworkX** e **Google Gemini**. A interface 2.0 utiliza exclusivamente o **IBM AML-Data (HI-Small)**, um conjunto de transações **100% sintético**. A plataforma não acessa dados reais de clientes, não consulta Pix/MED e **não comprova fraude ou lavagem de dinheiro**.

## Acessos

- Aplicação: https://nexuslens-frontend.vercel.app
- API: https://nexuslens-api.onrender.com
- Documentação Swagger: https://nexuslens-api.onrender.com/docs

**Atenção:** ter o código publicado não garante que a amostra IBM tenha sido importada no PostgreSQL desta implantação. Quando indisponível, a interface deve informar essa condição, sem substituir o dataset por registros antigos.

## Funcionalidades do NexusLens 2.0

| Tela | O que oferece |
| --- | --- |
| **Visão geral** | Indicadores e panorama de um recorte do grafo IBM |
| **Transações** | Consulta paginada de movimentações em USD, com filtros locais à página e detalhes |
| **Alertas** | Sinais de padrões definidos por regras de movimentação, para revisão humana |
| **Rede financeira** | Grafo interativo e métricas estruturais calculadas no backend |
| **Investigações** | Abertura e acompanhamento demonstrativo de casos em Kanban |
| **Nexus AI** | Geração de pareceres textuais pelo Gemini a partir de métricas agregadas |
| **Relatórios** | Histórico local de pareceres, busca, visualização e impressão/Salvar como PDF |
| **Configurações** | Preferências de interface e consulta somente leitura do status da fonte IBM |

As **Investigações** e o **Histórico de Relatórios** usam armazenamento local do navegador. Não há autenticação, sincronização entre dispositivos, trilha de auditoria em servidor ou armazenamento seguro de casos reais. A opção de PDF utiliza a impressão do navegador; não há exportação automática por serviço.

## Dados e interpretação

- Fonte: [IBM AML-Data](https://github.com/IBM/AML-Data), arquivo HI-Small_Trans.csv.
- Moeda exibida pela plataforma: **USD**. Não misturar com reais nem somar transações de moedas diferentes.
- O grafo trabalha com recorte limitado de transações, não com o conjunto completo do CSV.
- Scores e níveis de risco são **heurísticos/estruturais**; não equivalem a probabilidade de fraude.
- Os rótulos de lavagem do simulador não são utilizados como veredito pela interface.
- O Gemini redige pareceres a partir de indicadores agregados; não recebe a lista de contas e transações.
- Os dados IBM possuem licença **CDLA-Sharing-1.0**, distinta da licença MIT do código. Não incluir o CSV bruto no Git.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React, Vite, React Flow, Axios |
| API | Python, FastAPI, Pydantic, SQLAlchemy |
| Análise de rede | NetworkX, métricas e regras heurísticas |
| Armazenamento | PostgreSQL (incluindo Neon, conforme ambiente) |
| IA textual | Google Gemini |
| Infraestrutura | Vercel, Render, Docker Compose para PostgreSQL local |
| Versionamento | Git e GitHub |

## Executar localmente

Pré-requisitos: Python e Node.js compatíveis com as dependências do projeto, npm e uma conexão PostgreSQL de desenvolvimento. Não use credenciais de produção em arquivos versionados.

**1. Clonar:**

~~~bash
git clone https://github.com/isabelleferreiraa/NexusLens.git
cd NexusLens
~~~

**2. PostgreSQL local (opcional):**

~~~bash
docker compose up -d postgres
~~~

O arquivo docker-compose.yml sobe **somente o PostgreSQL**. Ele não inicia automaticamente frontend ou API. Configure as variáveis DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD para o backend, usando backend/.env.example como referência.

**3. Backend:**

~~~bash
cd backend
python -m venv .venv
# Ative o ambiente virtual conforme o seu sistema operacional.
pip install -r requirements.txt
uvicorn app.main:app --reload
~~~

**4. Frontend (em outro terminal, na pasta raiz):**

~~~bash
cd frontend
npm ci
npm run dev
~~~

Por padrão, o Vite encaminha /api para a API publicada no Render. Para usar um backend local, configure **VITE_API_BASE_URL=http://localhost:8000** no ambiente do frontend. Verifique a configuração de CORS e nunca publique segredos.

## Importação da amostra IBM

A importação **não acontece automaticamente** em commits, PRs ou deploys. Consulte [docs/ibm-aml-quickstart.md](docs/ibm-aml-quickstart.md) e [docs/ibm-aml-validation.md](docs/ibm-aml-validation.md) para download verificado, dry-run, importação em banco de **desenvolvimento** e testes. Importar ou modificar o banco conectado à produção exige validação e aprovação específicas.

## API

Rotas IBM, consultadas pela interface 2.0 (prefixo /api apenas no proxy do frontend):

| Método | Rota da API | Finalidade |
| --- | --- | --- |
| GET | /datasets/ibm-aml/status | Estado da amostra importada |
| GET | /datasets/ibm-aml/transacoes | Transações paginadas |
| GET | /datasets/ibm-aml/grafo | Grafo e indicadores do recorte |
| GET | /datasets/ibm-aml/alertas | Sinais de padrões de movimentação |
| POST | /relatorio | Parecer Gemini a partir de métricas agregadas |

As rotas anteriores /clientes, /transacoes e /grafo permanecem no backend por compatibilidade, **mas não são fontes da interface 2.0**. Veja também [docs/ibm-aml-api.md](docs/ibm-aml-api.md).

## Testes e limites de validação

~~~bash
# Frontend (dentro de frontend/)
node --test tests/*.test.mjs
npm run lint
npm run build
~~~

Para os testes do backend e a integração opcional com PostgreSQL local de teste, siga [docs/ibm-aml-validation.md](docs/ibm-aml-validation.md). A execução dos testes automatizados não substitui a verificação visual em desktop/celular, nem confirma por si só a presença dos dados no Render/Neon.

## Próximas etapas

Validar a importação real da amostra IBM em ambiente seguro; verificar APIs, Gemini e deploys; ampliar testes de acessibilidade e responsividade; e, em evolução futura, oferecer autenticação e persistência/auditoria de casos e relatórios no servidor.

Acompanhe em [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md).

## Autora

**Isabelle Ferreira Neri Feitoza** — Análise e Desenvolvimento de Sistemas, FIAP.

[GitHub](https://github.com/isabelleferreiraa) · [LinkedIn](https://www.linkedin.com/in/isabelle-ferreira-8844593ab/)
