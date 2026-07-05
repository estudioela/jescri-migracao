# ARCHITECTURE.md — Como o sistema Jescri funciona (visão humana)

> Este documento é para pessoas, não para orientar edição de código. Para isso, ver `CLAUDE.md`.

## O que é o sistema

O "ERP Jescri" é uma Planilha Google com automações (Google Apps Script) que a equipe da Estúdio Elã usa para gerenciar campanhas com influenciadoras. Dentro do mesmo projeto de Apps Script existe também o **Portal de Influenciadoras**: um site simples que cada influenciadora acessa para ver o que precisa entregar naquele mês, enviar fotos/vídeos e acompanhar o pagamento.

Não existem dois sistemas separados. É **uma planilha só** (o banco de dados) com **duas portas de entrada**:

1. A própria planilha, aberta no navegador da equipe — usada como ERP, com um menu customizado (" ERP ELÃ 6.2").
2. O Portal (`portal.estudioela.com`) — um site público que a influenciadora acessa de qualquer dispositivo.

## Como planilha e portal se conectam

```
                     ┌────────────────────────────┐
                     │      Planilha Google        │
                     │   (único banco de dados)     │
                     │                              │
                     │  abas: BASE DE DADOS,        │
                     │  BRIEFING, ATIVAÇÕES,        │
                     │  PAGAMENTOS, FLUXO LOGÍSTICO,│
                     │  HISTÓRICO DE ...            │
                     └───────────▲─────────▲────────┘
                                 │         │
                        lê/escreve       lê/escreve
                                 │         │
              ┌──────────────────┘         └────────────────────┐
              │                                                   │
   ┌──────────┴───────────┐                         ┌─────────────┴────────────┐
   │   ERP (menu na        │                         │   Portal (Web App        │
   │   própria planilha)   │                         │   público)                │
   │                        │                         │                           │
   │   equipe Estúdio Elã   │                         │   influenciadoras         │
   └────────────────────────┘                         └───────────────────────────┘
```

Não existe um banco de dados separado, nem uma API intermediária: tanto o ERP quanto o Portal são código Apps Script rodando "dentro" do Google, com acesso direto às abas da planilha. O Portal só existe como um Web App publicado a partir desse mesmo projeto — por isso uma mudança na estrutura da planilha (nome de aba, coluna) pode quebrar os dois ao mesmo tempo.

## Fluxo do usuário

### Equipe (Estúdio Elã) — usa o ERP dentro da planilha
1. Todo mês, alguém da equipe roda **"Iniciar Novo Mês"** no menu do ERP. Isso lê quem está com status "ON" na aba `BASE DE DADOS` e gera automaticamente: linhas de briefing, linhas de ativações (quantos Reels/Carrosséis/Stories cada influenciadora precisa entregar) e linhas de pagamento previsto.
2. Ao longo do mês, a equipe acompanha entregas e pagamentos direto nas abas da planilha. Algumas colunas têm automação: por exemplo, marcar uma ativação como "postado" move a linha automaticamente para o histórico.
3. Quando um pagamento é confirmado como "pago", a linha some da aba `PAGAMENTOS` e vai para `HISTÓRICO DE PAGAMENTOS` — isso é o que a influenciadora vê como "pago" no Portal.

### Influenciadora — usa o Portal
1. Acessa `portal.estudioela.com` e faz login com um **cupom** (código dela) e uma **senha simplificada** (os 5 primeiros dígitos do CNPJ cadastrado — não é uma senha forte, é assim por design).
2. Vê um painel com o que precisa entregar naquele mês (Reels, Carrosséis, Stories) e o briefing de cada peça (o texto/orientação de conteúdo).
3. Envia o material (foto/vídeo) direto pelo Portal — o arquivo vai para uma pasta dela no Google Drive, organizada por mês e por formato.
4. Acompanha o status de cada entrega (aguardando material → em aprovação → aprovado → publicado) e o status do pagamento (pendente → aprovado → pago) numa barra de progresso.
5. Pode ver o histórico de meses anteriores e editar alguns dados do próprio perfil (chave PIX, endereço, e-mail).

## Visão de alto nível das abas da planilha

| Aba | Para que serve |
|---|---|
| `BASE DE DADOS` | Cadastro de cada influenciadora (nome, cupom, CNPJ, PIX, endereço, valor do contrato). Fonte única de verdade — login e perfil do Portal leem só daqui. |
| `CADASTROS` | Respostas cruas do formulário de cadastro (Google Form), antes de virarem uma linha em `BASE DE DADOS`. |
| `BRIEFING` | O que cada influenciadora deve postar naquele mês, por formato (texto/orientação). |
| `ATIVAÇÕES` | Cada entrega de conteúdo do mês corrente (uma linha por Reel/Carrossel/Stories), com status e link do material enviado. |
| `PAGAMENTOS` | Pagamentos do mês corrente, com status (pendente/aprovado/pago). |
| `FLUXO LOGÍSTICO` | Envio de produtos físicos (looks) para a influenciadora, com rastreio dos Correios/transportadora. |
| `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO DE PAGAMENTOS`, `HISTÓRICO LOGÍSTICO` | Onde as linhas acima vão parar quando concluídas (arquivamento automático). |

## Deploy — como o código chega ao ar

- **O código do ERP e do Portal** (`mae/Código.js`, `mae/WebApp.js`, `mae/Index.html` etc.) fica neste repositório Git, na pasta `mae/`. Para publicar uma mudança, roda-se `clasp push` — isso envia o código para o projeto real do Google Apps Script (identificado por um `scriptId` fixo).
- **O domínio `portal.estudioela.com`** não aponta direto para o Apps Script. Ele é servido por **GitHub Pages**, usando a branch `pages-portal` **deste mesmo repositório** (não a `main`). Essa branch contém só uma página estática que carrega o Portal de dentro de um iframe, apontando para a URL de execução do Web App do Apps Script.
- Ou seja: mudar o comportamento do Portal exige publicar em dois lugares diferentes dependendo do que mudou — lógica/tela (`clasp push`, projeto Apps Script) ou o próprio domínio/redirecionamento (branch `pages-portal`, GitHub Pages).
