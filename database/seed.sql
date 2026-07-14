-- ==========================================
-- SEED - NEXUSLENS
-- ==========================================

-- USUARIO
INSERT INTO usuarios (nome,email,senha_hash)
VALUES
('Analista NexusLens','analista@nexuslens.com','$2b$12$hash_ficticio');

-- CLIENTES
INSERT INTO clientes
(cpf,nome,email,telefone,data_nascimento,cidade,estado)
VALUES
('11111111111','João Silva','joao@email.com','11999990001','1990-05-10','São Paulo','SP'),
('22222222222','Maria Oliveira','maria@email.com','11999990002','1988-08-15','São Paulo','SP'),
('33333333333','Pedro Santos','pedro@email.com','11999990003','1992-03-22','Santo André','SP'),
('44444444444','Ana Souza','ana@email.com','11999990004','1995-11-18','São Bernardo do Campo','SP'),
('55555555555','Carlos Lima','carlos@email.com','11999990005','1987-07-30','Mauá','SP'),
('66666666666','Fernanda Rocha','fernanda@email.com','11999990006','1994-01-12','Ribeirão Pires','SP'),
('77777777777','Lucas Almeida','lucas@email.com','11999990007','1991-09-08','Diadema','SP'),
('88888888888','Juliana Costa','juliana@email.com','11999990008','1993-04-05','São Caetano do Sul','SP'),
('99999999999','Rafael Gomes','rafael@email.com','11999990009','1989-12-27','Guarulhos','SP'),
('10101010101','Camila Martins','camila@email.com','11999990010','1996-06-14','Osasco','SP');

-- TRANSACOES
INSERT INTO transacoes
(id_cliente_origem,id_cliente_destino,valor,tipo_transacao,data_transacao)
SELECT c1.id_cliente,c2.id_cliente,v.valor,v.tipo,v.data
FROM (
VALUES
('11111111111','22222222222',850.50,'PIX','2026-07-01 09:15:00'::timestamp),
('11111111111','33333333333',1200.00,'TED','2026-07-01 11:00:00'),
('22222222222','44444444444',250.00,'PIX','2026-07-02 10:30:00'),
('33333333333','55555555555',3200.00,'TRANSFERENCIA','2026-07-02 14:20:00'),
('55555555555','11111111111',450.00,'PIX','2026-07-03 08:00:00'),
('44444444444','66666666666',980.00,'PIX','2026-07-03 13:00:00'),
('66666666666','77777777777',1500.00,'TED','2026-07-04 09:45:00'),
('77777777777','88888888888',730.00,'PIX','2026-07-04 15:15:00'),
('88888888888','99999999999',2100.00,'TRANSFERENCIA','2026-07-05 11:40:00'),
('99999999999','10101010101',199.90,'PIX','2026-07-05 17:25:00'),
('10101010101','11111111111',670.00,'PIX','2026-07-06 08:30:00'),
('22222222222','77777777777',560.00,'PIX','2026-07-06 16:00:00'),
('33333333333','88888888888',910.00,'TED','2026-07-07 12:20:00'),
('44444444444','99999999999',110.00,'PIX','2026-07-07 18:10:00'),
('55555555555','10101010101',760.00,'PIX','2026-07-08 09:05:00')
) v(origem,destino,valor,tipo,data)
JOIN clientes c1 ON c1.cpf=v.origem
JOIN clientes c2 ON c2.cpf=v.destino;

-- ANALISE
INSERT INTO analises
(id_usuario,id_cliente,algoritmo,status,pontuacao_risco,finalizada_em)
SELECT
u.id_usuario,
c.id_cliente,
'NetworkX',
'concluida',
82.40,
CURRENT_TIMESTAMP
FROM usuarios u, clientes c
WHERE u.email='analista@nexuslens.com'
AND c.cpf='11111111111';

-- METRICAS
INSERT INTO metricas_grafo
(id_analise,pagerank,degree_centrality,betweenness_centrality,closeness_centrality,eigenvector_centrality,quantidade_conexoes)
SELECT
id_analise,
0.45231891,
0.67000000,
0.32100000,
0.75100000,
0.61800000,
8
FROM analises
LIMIT 1;

-- RELATORIO
INSERT INTO relatorios
(id_analise,titulo,conteudo,modelo_ia,versao_prompt,tempo_processamento_ms)
SELECT
id_analise,
'Análise de Relacionamentos Financeiros',
'O cliente apresenta alta centralidade no grafo de transações, indicando forte participação na rede financeira.',
'gpt-5.5',
'v1.0',
1842
FROM analises
LIMIT 1;

-- LOG IA
INSERT INTO logs_ia
(id_analise,modelo_ia,prompt_utilizado,resposta_ia,tokens_entrada,tokens_saida,tempo_processamento_ms,status)
SELECT
id_analise,
'gpt-5.5',
'Gerar relatório com base nas métricas do grafo.',
'Relatório gerado com sucesso.',
650,
280,
1842,
'sucesso'
FROM analises
LIMIT 1;
