# Configurações do NexusLens 2.0

A página `/configuracoes` oferece preferências de navegação e diagnósticos **somente de leitura**.

## Preferências locais

- O menu lateral pode iniciar recolhido ou expandido; essa preferência também é aplicada pelo botão lateral.
- O usuário pode reduzir animações, sem desrespeitar a preferência de movimento reduzido do sistema operacional.
- As preferências são persistidas no `localStorage`, na chave `nexuslens.ui-preferences.v1`. Não contêm senhas, credenciais, contas nem transações.
- Quando o armazenamento está bloqueado, a mudança funciona enquanto a página está aberta e há um aviso de que não foi salva.

## Fonte IBM

- O painel consulta `GET /api/datasets/ibm-aml/status` (ou o endereço configurado no cliente Axios).
- Exibe exclusivamente o estado declarado pela API atual. Não acessa diretamente o banco Neon, não alterna branches, não executa SQL e não consegue importar o CSV.
- Diferencia os estados **pronto**, **vazio**, **não importado** e **erro de comunicação**; um erro de comunicação nunca é apresentado como dados ausentes.
- Mostra totais de contas/transações apenas para respostas que respeitem o contrato da API IBM, com `USD` e `dados_sinteticos: true`.

## Histórico demonstrativo

- A página informa as quantidades de relatórios e investigações no armazenamento **deste navegador** e dá acesso às páginas correspondentes.
- Não sincroniza o histórico entre máquinas, não substitui autenticação e não oferece controles destrutivos de banco de dados.

## Verificações

```bash
cd frontend
node --test tests/uiPreferences.test.mjs
npm run build
```

O build exige as dependências do projeto instaladas. A validação em preview deve incluir larguras de tela desktop e celular, navegação por teclado e opção de movimento reduzido.
