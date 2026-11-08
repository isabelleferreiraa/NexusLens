-- Tabelas de demonstração isoladas dos clientes/transacoes atuais.
-- Fonte: IBM AML-Data HI-Small, dados totalmente sintéticos.
-- Licença dos DADOS: CDLA-Sharing-1.0 (diferente da licença do código).
-- Não executa DROP, DELETE nem altera tabelas existentes.
CREATE TABLE IF NOT EXISTS ibm_aml_accounts (
    account_id VARCHAR(200) PRIMARY KEY,
    dataset_id VARCHAR(50) NOT NULL,
    bank_ref VARCHAR(60) NOT NULL,
    account_ref VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS ibm_aml_transactions (
    transaction_id VARCHAR(80) PRIMARY KEY,
    dataset_id VARCHAR(50) NOT NULL,
    origin_id VARCHAR(200) NOT NULL REFERENCES ibm_aml_accounts(account_id),
    destination_id VARCHAR(200) NOT NULL REFERENCES ibm_aml_accounts(account_id),
    occurred_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    amount_paid NUMERIC(20, 2) NOT NULL,
    payment_currency VARCHAR(50) NOT NULL,
    amount_received NUMERIC(20, 2) NOT NULL,
    receiving_currency VARCHAR(50) NOT NULL,
    payment_format VARCHAR(64),
    is_laundering_label BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ibm_aml_trans_source ON ibm_aml_transactions(origin_id);
CREATE INDEX IF NOT EXISTS idx_ibm_aml_trans_destination ON ibm_aml_transactions(destination_id);
CREATE INDEX IF NOT EXISTS idx_ibm_aml_trans_date ON ibm_aml_transactions(occurred_at);
