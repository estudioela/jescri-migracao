# erp-portal

Portal de Influenciadoras Jescri (cadastro de creators, briefings, cachê/pagamentos
e tracking de entregas), versionado via [clasp](https://github.com/google/clasp) e
publicado como Google Apps Script Web App.

Isolado do restante deste repositório (site institucional e `cliente/`) — não
depende de nada fora desta pasta.

## ⚠️ NÃO RODAR `clasp push` A PARTIR DAQUI (por enquanto)

O `scriptId` atual no `.clasp.json` local (git-ignorado) está **desatualizado /
incorreto** — não é o mesmo do projeto Apps Script live "[ELÃ] ERP INFLUÊNCIA"
(o correto é `1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`, confirmado
em `jescri-migracao/mae/.clasp.json` e `jescri-migracao/portal-360/.clasp.json.DISABLED`).

**Não corrija esse valor sem antes migrar os arquivos que faltam aqui.** Esta
pasta só contém o subconjunto "Portal" (SPA + auth + entregas). Ela NÃO tem
`Código.js`, `Portal.js`, `Sidebar.html`, `SidebarPagamento.html`,
`SincronizarPortal.js`, `SidebarBackend.js` do ERP administrativo, que existem
no projeto live. Um `clasp push` daqui — mesmo com o scriptId corrigido —
substituiria o projeto remoto inteiro pelo conteúdo local e apagaria esses
arquivos, repetindo o incidente de 2026-07-04 (ver
`jescri-migracao/portal/README_PERIGO.md`).

Antes de reativar o push a partir daqui: migrar/dividir os arquivos do ERP
administrativo para dentro de `src/` (ex.: um novo módulo `src/erp-admin/`),
igual foi feito com `WebApp.js` → `src/erp/` + `src/portal/`. Até lá, o
diretório canônico e seguro para `clasp push` é `jescri-migracao/mae/`.

## Estrutura

```
erp-portal/
├── .clasp.json              (git-ignorado; contém o scriptId real, veja .clasp.json.example; rootDir é "src")
├── .clasp.json.example
└── src/
    ├── appsscript.json
    ├── erp/
    │   ├── config.gs            # IDs de planilhas/pastas e mapeamento de colunas (MAP)
    │   ├── utils.gs             # helpers compartilhados (datas, valores, status, pastas do Drive)
    │   ├── influenciadoras.gs   # cadastro de creators: contato, dados cadastrais, chave Pix
    │   ├── briefings.gs         # briefing de campanha por creator
    │   ├── caches.gs            # controle de cachê e status de pagamento
    │   ├── entregas.gs          # pendências, histórico e upload resumable de material
    │   └── sincronizador.gs     # menu + sync down (Planilha Mãe -> Portal)
    ├── portal/
    │   ├── auth.gs              # login por cupom + validação/renovação de sessão
    │   └── views.gs             # doGet e include() — o que a influenciadora vê
    └── ui/
        ├── portal-index.html    # markup + JS do cliente (SPA de uma página)
        └── styles.html          # CSS, incluído via include('styles') no <head>
```

## Diferenças em relação ao layout inicialmente planejado

O código migrado (antes em `Index.html`, `Sincronizador.js`, `WebApp.js`, na raiz
do projeto local) trouxe responsabilidades que não cabiam nos arquivos originalmente
previstos sem duplicar lógica. Duas adições:

- **`erp/config.gs`** — constantes e o mapeamento `MAP` de colunas das planilhas,
  usados por praticamente todos os outros arquivos (escopo global do Apps Script).
- **`erp/utils.gs`** — funções auxiliares (formatação de data/valor, normalização
  de status, helpers de pasta do Drive) usadas por mais de um domínio.
- **`erp/sincronizador.gs`** — não estava no escopo inicial, mas é o script que
  sincroniza a Planilha Mãe com a base do Portal (menu do Sheets); mantido como
  parte do ERP.

`getHistorico()` retorna ativações e pagamentos juntos (contrato já consumido pelo
frontend) e foi mantida como uma função só em `entregas.gs`, em vez de dividida
entre `entregas.gs` e `caches.gs`, para não alterar a API existente.

## Hardening pós-migração

A partir de uma auditoria do código migrado, foram aplicados ajustes pontuais
sem mudar o modelo de dados nem a API já consumida pelo frontend:

- **`logout(token)`** (`portal/auth.gs`) — invalida o token no `CacheService`;
  antes não existia forma de encerrar sessão além da expiração por inatividade
  (6h). Exposto na UI via botão "Sair" na tela de Perfil.
- **Bloqueio por tentativas no `login()`** — como a "senha" é o prefixo do CNPJ
  (baixa entropia, não é um segredo gerado), até 5 tentativas erradas por cupom
  agora bloqueiam novas tentativas por 15 minutos (`CacheService`).
- **Mensagens de erro genéricas para o cliente** — `login`, `getPendencias`,
  `getHistorico`, `getPagamentos`, `getBriefing`, `getPerfil`, `updatePerfil`,
  `iniciarEnvioResumable` e `finalizarEnvioResumable` não retornam mais
  `e.message` cru (podia vazar detalhes internos); o detalhe da exceção vai só
  para o log (Stackdriver), o cliente recebe `"ERRO_INTERNO"`.
- **Toast em sessão expirada** — o frontend agora avisa "Sua sessão expirou.
  Faça login novamente." em vez de só redirecionar em silêncio pro login.

Não alterados nesta rodada (fora do escopo de um ajuste pontual): o lock
global do `LockService` como possível gargalo de concorrência, e a leitura
completa das planilhas a cada requisição — ambos são limitações de
escalabilidade do modelo atual (Sheets como banco de dados), não bugs.

## Setup local

1. Copie `.clasp.json.example` para `.clasp.json` e preencha `scriptId` com o ID
   do projeto Apps Script (Extensões → Apps Script → ⚙️ Configurações do projeto).
2. `npm install -g @google/clasp` (se ainda não tiver) e `clasp login`.
3. `cd erp-portal && clasp push` para enviar, `clasp open` para abrir no editor.
