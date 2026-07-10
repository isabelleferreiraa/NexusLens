# 🧠 NexusLens

> Plataforma inteligente de apoio à decisão para analistas bancários, utilizando grafos e inteligência artificial para transformar dados em insights estratégicos.

---

## 💼 Cenário

Imagine um analista de um banco responsável por avaliar centenas de clientes diariamente.

Para entender o perfil financeiro de um único cliente, normalmente é necessário consultar diversas fontes de dados, interpretar movimentações, analisar produtos financeiros e elaborar um relatório executivo. Esse processo pode consumir vários minutos por cliente e exige grande esforço operacional.

O **NexusLens** foi criado para automatizar esse fluxo.

A plataforma reúne informações do cliente, transforma os relacionamentos em um grafo, calcula métricas relevantes e utiliza Inteligência Artificial para gerar um relatório claro, objetivo e pronto para apoiar a tomada de decisão.

---

## 🎯 Objetivo

Desenvolver uma plataforma capaz de auxiliar analistas bancários na análise do perfil financeiro de clientes através da combinação de:

- 🌐 Análise de Grafos
- 🤖 Inteligência Artificial
- 📊 Indicadores Financeiros
- 🏦 Banco de Dados Relacional

---

## 🚀 Funcionalidades

- 🔍 Busca de clientes por ID
- 🏦 Consulta de dados financeiros
- 🌐 Construção automática de grafos de relacionamento
- 📊 Cálculo de métricas financeiras
- 🤖 Geração de relatórios executivos utilizando IA
- 💬 Assistente inteligente para consultas sobre o cliente
- 📈 Dashboard com indicadores estratégicos

---

## 🏗️ Arquitetura

```text
               Front-end (React)

                      │

                      ▼

               API (FastAPI)

                      │

        ┌─────────────┴─────────────┐

        ▼                           ▼

 Banco de Dados             Motor Analítico

(PostgreSQL)                 (NetworkX)

        │                           │

        └─────────────┬─────────────┘

                      ▼

            Inteligência Artificial

                      │

                      ▼

            Relatório Executivo
```

---

## 🛠️ Tecnologias

| Tecnologia | Finalidade |
|------------|------------|
| Python | Backend |
| FastAPI | API REST |
| PostgreSQL | Banco de Dados |
| NetworkX | Construção e análise de grafos |
| Pandas | Manipulação de dados |
| React | Interface do usuário |
| TypeScript | Front-end |
| Docker | Containerização |
| Pytest | Testes automatizados |
| GitHub Actions | Integração Contínua (CI/CD) |

---

## 📂 Estrutura do Projeto

```text
NexusLens/
│
├── backend/
│
├── docs/
│
├── frontend/
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔄 Fluxo da Aplicação

```text
Analista

      │

      ▼

Busca do Cliente

      │

      ▼

Banco de Dados

      │

      ▼

Construção do Grafo

      │

      ▼

Cálculo das Métricas

      │

      ▼

Inteligência Artificial

      │

      ▼

Relatório Executivo
```

---

## 🚀 Roadmap

- [x] Planejamento da solução
- [ ] Modelagem do banco de dados
- [ ] Desenvolvimento da API
- [ ] Construção do grafo
- [ ] Motor analítico
- [ ] Integração com Inteligência Artificial
- [ ] Dashboard Web
- [ ] Docker
- [ ] Testes automatizados
- [ ] CI/CD
- [ ] Deploy

---

## ⭐ Diferenciais

- Arquitetura baseada em camadas
- Modelagem relacional integrada a grafos
- Separação entre motor analítico e Inteligência Artificial
- Dashboard para apoio à decisão
- Documentação completa
- Código organizado seguindo boas práticas
- Projeto inspirado em um cenário corporativo bancário

---

## 🔮 Próximas Evoluções

- Detecção de padrões financeiros
- Score inteligente do cliente
- Exportação de relatórios em PDF
- Dashboard com visualização interativa de grafos
- Novos indicadores financeiros
- Histórico de análises

---

## 👨‍💻 Autora
- Isabelle Ferreira Neri Feitoza

- Estudante de Análise e Desenvolvimento de Sistemas — FIAP
- RM 573507 | Turma: 1TDSPH

LinkedIn | GitHub

Projeto desenvolvido para fins de estudo e demonstração de conhecimentos em Engenharia de Software, Grafos, Inteligência Artificial e Desenvolvimento Full Stack.