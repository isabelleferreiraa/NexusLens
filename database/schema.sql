CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================
-- TABELA: USUARIOS
-- ===========================

CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- TABELA: CLIENTES
-- ===========================

CREATE TABLE clientes (
    id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cpf CHAR(11) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20),

    data_nascimento DATE NOT NULL,

    cidade VARCHAR(100),
    estado CHAR(2),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- TABELA: TRANSACOES
-- ===========================

CREATE TABLE transacoes (
    id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_cliente_origem UUID NOT NULL,
    id_cliente_destino UUID NOT NULL,

    valor DECIMAL(15,2) NOT NULL,

    tipo_transacao VARCHAR(20) NOT NULL CHECK (
        tipo_transacao IN (
            'PIX',
            'TED',
            'DOC',
            'BOLETO',
            'TRANSFERENCIA'
        )
    ),

    data_transacao TIMESTAMP NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cliente_origem
        FOREIGN KEY (id_cliente_origem)
        REFERENCES clientes(id_cliente)
        ON DELETE CASCADE,

    CONSTRAINT fk_cliente_destino
        FOREIGN KEY (id_cliente_destino)
        REFERENCES clientes(id_cliente)
        ON DELETE CASCADE
);

-- ===========================
-- TABELA: ANALISES
-- ===========================

CREATE TABLE analises (
    id_analise UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_usuario UUID NOT NULL,
    id_cliente UUID NOT NULL,

    algoritmo VARCHAR(50) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (
        status IN (
            'pendente',
            'processando',
            'concluida',
            'erro'
        )
    ),

    pontuacao_risco DECIMAL(5,2),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizada_em TIMESTAMP,

    CONSTRAINT fk_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON DELETE CASCADE
);

-- ===========================
-- TABELA: METRICAS_GRAFO
-- ===========================

CREATE TABLE metricas_grafo (
    id_metrica UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_analise UUID NOT NULL,

    pagerank DECIMAL(12,8),
    degree_centrality DECIMAL(12,8),
    betweenness_centrality DECIMAL(12,8),
    closeness_centrality DECIMAL(12,8),
    eigenvector_centrality DECIMAL(12,8),

    quantidade_conexoes INTEGER,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metrica_analise
        FOREIGN KEY (id_analise)
        REFERENCES analises(id_analise)
        ON DELETE CASCADE
);

-- ===========================
-- TABELA: RELATORIOS
-- ===========================

CREATE TABLE relatorios (
    id_relatorio UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_analise UUID NOT NULL UNIQUE,

    titulo VARCHAR(150) NOT NULL,

    conteudo TEXT NOT NULL,

    modelo_ia VARCHAR(100) NOT NULL,

    versao_prompt VARCHAR(30),

    tempo_processamento_ms INTEGER,

    gerado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_relatorio_analise
        FOREIGN KEY (id_analise)
        REFERENCES analises(id_analise)
        ON DELETE CASCADE
);

-- ===========================
-- TABELA: LOGS_IA
-- ===========================

CREATE TABLE logs_ia (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_analise UUID NOT NULL,

    modelo_ia VARCHAR(100) NOT NULL,

    prompt_utilizado TEXT,

    resposta_ia TEXT,

    tokens_entrada INTEGER,
    tokens_saida INTEGER,

    tempo_processamento_ms INTEGER,

    status VARCHAR(20) NOT NULL CHECK (
        status IN ('sucesso', 'erro')
    ),

    mensagem_erro TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_analise
        FOREIGN KEY (id_analise)
        REFERENCES analises(id_analise)
        ON DELETE CASCADE
);