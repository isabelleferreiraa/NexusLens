# 🧠 NexusLens

![Python](https://img.shields.io/badge/Python-3.13-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![NetworkX](https://img.shields.io/badge/NetworkX-Graphs-orange)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-blueviolet)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)
![License](https://img.shields.io/badge/License-MIT-green)

Plataforma inteligente para análise de redes financeiras utilizando Inteligência Artificial, Teoria dos Grafos e Machine Learning, desenvolvida com FastAPI, React e PostgreSQL.

---

# 📑 Sumário

- Sobre o projeto
- Funcionalidades
- Tecnologias
- Arquitetura
- Como executar
- Estrutura
- Endpoints
- Inteligência Artificial
- Teoria dos Grafos
- Resultados
- Objetivo
- Aprendizados
- Melhorias futuras

---

# 📌 Sobre o projeto

O **NexusLens** é uma plataforma desenvolvida para auxiliar analistas financeiros na identificação de padrões de risco em redes de transações.

O projeto combina **Teoria dos Grafos**, **Análise de Redes** e **Inteligência Artificial** para transformar dados financeiros em informações estratégicas, permitindo identificar possíveis comportamentos suspeitos e gerar recomendações automáticas.

Toda a análise é realizada a partir de uma rede de transações financeiras, onde os clientes são representados como nós e as transações como conexões entre eles.

Além da análise estrutural da rede, o sistema utiliza a API do **Google Gemini** para gerar relatórios inteligentes em linguagem natural.

---

# ✨ Funcionalidades

A plataforma oferece as seguintes funcionalidades:

- Construção de redes financeiras utilizando Teoria dos Grafos
- Cálculo automático do Score de Risco
- Classificação do nível de risco
- Identificação da influência de clientes na rede
- Geração automática de recomendações
- Geração de relatórios inteligentes utilizando IA
- Dashboard interativo para visualização dos resultados
- API REST desenvolvida com FastAPI
- Persistência dos dados em PostgreSQL

---

# 🛠️ Tecnologias utilizadas

| Tecnologia | Finalidade |
|------------|------------|
| **Python 3.13** | Linguagem principal |
| **FastAPI** | Desenvolvimento da API |
| **React** | Interface da aplicação |
| **Axios** | Comunicação Front-end / API |
| **SQLAlchemy** | ORM |
| **PostgreSQL** | Banco de dados |
| **NetworkX** | Construção e análise dos grafos |
| **Google Gemini API** | Geração dos relatórios inteligentes |
| **Docker** | Containerização |
| **Git** | Controle de versão |

---

# 🏗️ Arquitetura

```mermaid
flowchart LR

A[(PostgreSQL)]
A --> B[FastAPI]

B --> C[NetworkX]

C --> D[Cálculo das Métricas]

D --> E[Score de Risco]

D --> F[Análise Estrutural]

E --> G[Google Gemini]

F --> G

G --> H[React Dashboard]
```

---

# ⚙️ Como executar o projeto

## 1. Clone o repositório

```bash
git clone https://github.com/isabelleferreiraa/NexusLens.git
```

## 2. Entre na pasta do projeto

```bash
cd NexusLens
```

---

## 🐳 Opção 1 — Execução com Docker

```bash
docker compose up --build
```

---

## ▶️ Opção 2 — Execução Local

### Backend

```bash
cd backend

python -m venv .venv
```

Ative o ambiente virtual.

Instale as dependências.

```bash
pip install -r requirements.txt
```

Execute a API.

```bash
uvicorn app.main:app --reload
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📂 Estrutura do projeto

```text
NexusLens/

├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── docs/
│
├── docker-compose.yml
├── README.md
└── LICENSE
```

---

# 📡 Endpoints

| Método | Endpoint | Descrição |
|----------|----------|------------|
| GET | / | Status da API |
| GET | /clientes | Lista de clientes |
| GET | /transacoes | Lista de transações |
| GET | /grafo | Geração da análise financeira |

---

# 🧠 Inteligência Artificial

O NexusLens utiliza a API do **Google Gemini** para interpretar automaticamente os resultados obtidos pela análise da rede financeira.

A IA recebe um resumo contendo métricas da rede e gera um relatório em linguagem natural apresentando:

- Identificação do nível de risco;
- Interpretação das conexões;
- Possíveis padrões suspeitos;
- Recomendações para o analista financeiro.

---

# 🌐 Teoria dos Grafos

A rede financeira é representada utilizando grafos.

Na modelagem:

- Nós representam clientes;
- Arestas representam transações financeiras.

A partir dessa estrutura são calculadas métricas como:

- Influência na rede;
- Quantidade de conexões;
- Papel estrutural do cliente;
- Score de risco.

---

# 📊 Resultado

Ao final da análise, a plataforma fornece:

- ✅ Dashboard interativo
- ✅ Score de risco
- ✅ Classificação automática
- ✅ Métricas da rede financeira
- ✅ Recomendações inteligentes
- ✅ Relatório gerado pela IA
- ✅ Persistência dos dados em PostgreSQL

---

# 🎯 Objetivo do projeto

Desenvolver uma plataforma inteligente capaz de transformar dados de redes financeiras em informações estratégicas por meio da combinação entre Inteligência Artificial, Teoria dos Grafos e Engenharia de Software, apoiando processos de análise de risco e tomada de decisão.

---

# 💡 Aprendizados

- Desenvolvimento de APIs com FastAPI
- Construção de interfaces com React
- Integração Front-end e Back-end
- Modelagem de banco de dados com PostgreSQL
- Aplicação de Teoria dos Grafos utilizando NetworkX
- Consumo da API do Google Gemini
- Organização de projetos Full Stack
- Containerização com Docker
- Boas práticas de Engenharia de Software

---

# 🔮 Melhorias futuras

- Histórico das análises realizadas
- Exportação de relatórios em PDF
- Sistema de autenticação de usuários
- Atualização da rede em tempo real
- Dashboard analítico avançado
- Filtros inteligentes na rede financeira

---

# 👨‍💻 Autora

**Isabelle Ferreira Neri Feitoza**

Estudante de Análise e Desenvolvimento de Sistemas — FIAP  
RM 573507 | Turma: 1TDSPH

- [LinkedIn](https://www.linkedin.com/in/isabelle-ferreira-8844593ab/)
- [GitHub](https://github.com/isabelleferreiraa)
