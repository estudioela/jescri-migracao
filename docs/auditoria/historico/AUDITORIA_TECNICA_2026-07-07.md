# AUDITORIA TÉCNICA COMPLETA — Jescri ERP + Portal de Influenciadoras

> Data: 2026-07-07. Escopo: leitura integral de todo o código-fonte do projeto (`mae/*.js`, `mae/*.gs`, `mae/*.html`, `mae/appsscript.json`, `mae/.clasp.json`) mais toda a documentação de apoio existente (`CLAUDE.md`, `FLOW.md`, `SYSTEM_TRUTH.md`, `SYSTEM_MAP.md`, `PROJECT_GOVERNANCE.md`, `docs/spec/system_spec_v1.md`), e verificação do estado real do Git/GitHub (branches, tags, proteção de branch, GitHub Pages). Nenhuma alteração de código foi feita. Este documento é um relatório de leitura — onde há dúvida ou achado, isso é sinalizado explicitamente, não silenciado.
>
> **Relação com a documentação existente**: `CLAUDE.md`/`FLOW.md`/`SYSTEM_TRUTH.md`/`SYSTEM_MAP.md` continuam sendo as fontes primárias para execução de tarefas (`CLAUDE.md` seções 9-10). Este documento é um retrato consolidado e mais amplo (front-end, dívidas técnicas, checklist, recomendações) que aponta para eles em vez de duplicá-los onde já são autoritativos — divergências entre este documento e aqueles devem ser resolvidas a favor da leitura mais recente do código.

---

## 1. Visão geral do sistema

Jescri é um ERP + Portal de Influenciadoras operado como **um único projeto Google Apps Script** (`scriptId: 1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`), com a **planilha Google `[JESCRI] INFLUÊNCIA 360º` como único banco de dados** — não existe banco de dados separado, ORM, ou camada de persistência além do próprio Google Sheets.

Dois públicos, dois "aplicativos" dentro do mesmo projeto:
- **ERP** (`mae/Código.js`): roda dentro da própria planilha, como menu customizado (`onOpen()`) e automações (`onEdit`, `onFormSubmit`, triggers de tempo). Usado pela equipe interna (gestores).
- **Portal** (`mae/WebApp.js` + `mae/Index.html`): Web App público (`doGet`/`doPost`), servido em `portal.estudioela.com` via um iframe redirecionador hospedado em GitHub Pages (branch `pages-portal` deste mesmo repositório). Usado pelas influenciadoras (sem conta Google — login por cupom/senha próprios).

Não há build step, bundler, framework de front-end, ou dependências de pacote (`npm`/`package.json` inexistentes) — tudo é JavaScript/HTML servido diretamente pelo runtime V8 do Apps Script.

---

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Google Apps Script Project (scriptId único)                │
│                                                               │
│  ┌───────────────┐   ┌────────────────────────────────────┐ │
│  │  Código.js    │   │  WebApp.js (doGet/doPost)          │ │
│  │  (ERP, menu,  │   │    └── Index.html (SPA, servida)   │ │
│  │  onEdit,      │   │                                     │ │
│  │  onFormSubmit)│   │  SidebarBackend.js                  │ │
│  │               │   │    └── Sidebar.html                 │ │
│  │  SchemaExporter│   │    └── SidebarPagamento.html        │ │
│  │  QaShadow.js  │   │  PortalUi.gs (preview em modal)      │ │
│  └───────┬───────┘   └────────────────┬────────────────────┘ │
│          │                            │                       │
│          └──────────► Planilha Google ◄───────────────────────┘
│              "[JESCRI] INFLUÊNCIA 360º" (única fonte de dados)
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
   Google Drive                    portal.estudioela.com
 (arquivos enviados,               (GitHub Pages, branch
  pasta por influenciadora)         pages-portal, iframe →
                                     exec URL do Web App)
```

**Fluxo de rede do Portal**: navegador da influenciadora → `portal.estudioela.com` (GitHub Pages, iframe) → `https://script.google.com/macros/s/AKfycbyBqxe6.../exec` (deployment fixa do Web App) → `doGet()`/`doPost()` em `mae/WebApp.js` → planilha via `SpreadsheetApp`.

**Duas superfícies de API expostas pelo mesmo backend**:
1. `google.script.run` — chamado diretamente por `mae/Index.html` (`chamar()`/`chamarServidorBruto()`, ~L912-936). **Este é o caminho real usado em produção.**
2. `doPost()` + `API_ACOES` (`mae/WebApp.js` ~L179-212) — shim JSON aditivo, pensado para um SPA hospedado separadamente que nunca chegou a existir/ser usado pelo `Index.html` atual. Mantido, mas é superfície morta do ponto de vista do fluxo real (ver seção 16, dívidas técnicas).

---

## 3. Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Runtime backend | Google Apps Script, V8 runtime (`appsscript.json: runtimeVersion: "V8"`) |
| Linguagem backend | JavaScript (ES6+, sem TypeScript, sem transpilação) |
| Persistência | Google Sheets (via `SpreadsheetApp`) — único banco de dados |
| Arquivos | Google Drive (via `DriveApp` + upload resumable direto à API REST do Drive) |
| Front-end | HTML+CSS+JS vanilla, um único arquivo (`mae/Index.html`), sem framework (sem React/Vue/etc.), sem bundler |
| Fontes | Google Fonts (EB Garamond, Archivo Narrow, Inter, Material Symbols Outlined) via CDN |
| Cache/sessão | `CacheService` (Apps Script) — tokens de sessão, tentativas de login, cache de influKey, cache de abas legado |
| Configuração persistente | `PropertiesService` (Apps Script) — pasta de Drive por cupom, token QA Shadow |
| Deploy | `clasp` (Google's Command Line Apps Script Projects), a partir de `mae/` |
| Hospedagem do domínio público | GitHub Pages (branch `pages-portal`, mesmo repositório), como iframe redirecionador estático |
| Versionamento | Git/GitHub, `main` protegida (PR obrigatório, sem force-push, `enforce_admins: true`) |
| Integrações externas | BrasilAPI (CEP), BRComerce (rastreio logístico) |
| CI/CD | Nenhum pipeline de CI encontrado no repositório (sem `.github/workflows`) — deploy é manual via `clasp push`/`clasp deploy` |

---

## 4. Estrutura de pastas

```
/ (raiz do repo Git — único repositório, sem submodules)
├── mae/                        ← projeto Apps Script real (rootDir do clasp)
│   ├── .clasp.json             scriptId, config de push
│   ├── .claspignore            allowlist explícita (9 arquivos legítimos)
│   ├── appsscript.json         manifest (scopes, config webapp)
│   ├── Código.js               ERP — menu, automações de planilha (854 linhas)
│   ├── WebApp.js               Backend do Portal — doGet/doPost, API (996 linhas)
│   ├── Index.html              Front-end do Portal — SPA único (1574 linhas)
│   ├── PortalUi.gs             abrirPortalModal() — preview do Portal na planilha
│   ├── SidebarBackend.js       backend das sidebars do ERP (118 linhas)
│   ├── Sidebar.html            sidebar "Editar Dados da Influenciadora"
│   ├── SidebarPagamento.html   sidebar "Lançar Pagamento Extra/UGC"
│   ├── SchemaExporter.js       gera SYSTEM_SCHEMA.json/.md + checklist de integridade (427 linhas)
│   ├── QaShadow.js             teste E2E de contrato, sem tocar produção (318 linhas)
│   └── legacy/                 NÃO faz parte do app — histórico/backup local (_archive/, README.md)
├── sites/                       vazio — placeholder oficial para sites auxiliares (não explorar)
├── docs/                        documentação (não é código, não afeta runtime)
│   ├── design-reference/        referência visual do Stitch (não é código do app)
│   ├── spec/system_spec_v1.md   snapshot da sessão de auditoria de 2026-07-05
│   └── (outros .md/.txt de contexto histórico)
├── CLAUDE.md                    mapa técnico — regras de execução para agentes
├── FLOW.md                      fluxos executáveis (fonte primária de execução)
├── SYSTEM_MAP.md                mapa completo por aba da planilha
├── SYSTEM_TRUTH.md              estado real consolidado do sistema
├── PROJECT_GOVERNANCE.md        regras estruturais do repositório
└── .claude/                     configuração do Claude Code (não afeta runtime)
```

**Nota de governança**: `PROJECT_GOVERNANCE.md` define `/mae` (sistema), `/sites` (auxiliares) e `/docs` (documentação) como a estrutura oficial única — confirmado, nenhum desvio encontrado.

---

## 5. Fluxos completos da aplicação

Documentados passo a passo com arquivo+função+linha em `FLOW.md` — não duplicado aqui linha a linha. Resumo consolidado, confirmado por leitura direta nesta sessão:

| Fluxo | Entrada | Processamento | Saída |
|---|---|---|---|
| **Login** | `Index.html:fazerLogin()` ~L1068 | `WebApp.js:login()` ~L218 — senha = 5 primeiros dígitos do CNPJ, bloqueio 5 tentativas/15min | token UUID (CacheService, 6h) ou `{ok:false, erro}` |
| **Sessão** | qualquer chamada autenticada | `validarToken()` ~L275 (renovação deslizante), `logout()` ~L288 | sessão válida/inválida |
| **Dashboard/Pendências** | abertura do dashboard | `getPendencias()` ~L299 + `listarPeriodos()` ~L691 | lista de ativações do período |
| **Briefing** | abrir briefing de uma ativação | `getBriefing()` ~L349 (cruza `ATIVAÇÕES`+`BRIEFING`) | texto do briefing + resumo do mês |
| **Envio de material** | seleção de arquivo(s) | `iniciarEnvioResumable()` ~L897 + upload resumable direto ao Drive + `finalizarEnvioResumable()` ~L954 | arquivo no Drive + `STATUS_CONTEUDO="ajustes"` |
| **Pagamentos** | abrir tela de pagamentos | `getPagamentos()` ~L431 (normaliza status) | tracker visual PENDENTE→APROVADO→PAGO |
| **Histórico** | abrir histórico | `getHistorico()` ~L490 (agrega oficiais + abas legado detectadas dinamicamente) | lista consolidada |
| **Perfil** | abrir/editar perfil | `getPerfil()` ~L568 / `updatePerfil()` ~L613 (só 5 campos editáveis) | dados exibidos/atualizados |
| **Ciclo mensal (ERP)** | menu "Iniciar Novo Mês" | `gerarNovoMesCompleto()` ~L83 — cria linhas em BRIEFING/ATIVAÇÕES/FLUXO/PAGAMENTOS por influenciadora ativa | planejamento do mês gerado |
| **Arquivamento** | `onEdit` (automático) ou menu (manual) | `arquivarGenerico()` ~L611 — move linha inteira para aba de histórico | linha migrada + `DATA_PAGAMENTO`/`DATA_ARQUIVAMENTO` preenchidas |
| **Cadastro de influenciadora** | Google Form externo | `onFormSubmit()` ~L646 — enriquece endereço via BrasilAPI | nova linha em `BASE DE DADOS` (status `OFF`) |
| **Sincronização de looks** | menu "Puxar Looks" | `sincronizarLooks()` ~L432 — lê planilha externa por influenciadora | `BRIEFING` atualizado com looks |
| **Rastreio logístico** | menu "Atualizar Rastreios" | `atualizarRastreiosBRComerce()` ~L471 — consulta API BRComerce | `STATUS_LOGISTICA` atualizado + arquivamento de entregues |

**Achado confirmado nesta auditoria (já documentado em `FLOW.md`/`SYSTEM_MAP.md`, não é achado novo)**: **não existe** derivação automática `STATUS_CONTEUDO`→`STATUS_PAGAMENTO`. São camadas independentes; a transição de `STATUS_PAGAMENTO` para `PAGO` é sempre edição manual da equipe.

---

## 6. Regras de negócio

1. **Autenticação por baixa entropia, deliberada**: usuário = `CUPOM` (texto livre, ex. "NOME10"), senha = 5 primeiros dígitos do CNPJ. Não é um bug — está documentado como decisão consciente (`WebApp.js` ~L9-11), mitigada por bloqueio de 5 tentativas/15min **por cupom** (não global).
2. **Sessão**: token UUID válido por 6h (21600s), renovação deslizante a cada chamada validada (`validarToken()`). Persistido em `localStorage` do navegador (não `sessionStorage`) — sobrevive ao fechar a aba.
3. **`STATUS_CONTEUDO`** (aba `ATIVAÇÕES`) tem validação de dados na própria célula do Sheets, aceitando só 5 valores literais: `em aberto`, `falta drive`, `aprovado`, `ajustes`, `postado`. O único valor gravado automaticamente por código é `"ajustes"` (ao finalizar upload) — `aprovado`/`postado` são sempre edição manual da equipe.
4. **`STATUS_PAGAMENTO`** (aba `PAGAMENTOS`): `PAGO` é sempre edição manual. Ao ser marcado, dispara automaticamente (`onEdit`) arquivamento da linha inteira para `HISTÓRICO DE PAGAMENTOS`, preenchendo `DATA_PAGAMENTO` só se ainda vazia.
5. **Cálculo de data de aprovação**: `calcularDataAprovacao()` (`Código.js` ~L305) = `DATA_ATIVACAO` menos 7 dias, empurrado para a segunda-feira seguinte se cair em sexta/sábado/domingo.
6. **Upload de material**: multi-arquivo, resumable (chunk de 8MB no front-end), resolvido por ID estável (UUID por ativação, não número de linha) para evitar corrida com edições concorrentes na planilha.
7. **Perfil**: só 5 campos são editáveis pela influenciadora via Portal — `chavePix`, `email`, `cep`, `numero`, `complemento`. Nome, CNPJ, cidade, UF são somente leitura (vêm do cadastro/CEP).
8. **Ativações por mês**: quantidade de REEL/CARROSSEL/STORIES é definida por influenciadora em `BASE DE DADOS` (`REELS_TEXTO`/`CARROSSEL_TEXTO`/`STORIES_TEXTO`) e gera uma linha em `ATIVAÇÕES` por unidade contratada a cada novo mês.
9. **Arquivamento**: `arquivarGenerico()` é uma função única compartilhada pelas 3 abas operacionais (`ATIVAÇÕES`, `PAGAMENTOS`, `FLUXO LOGÍSTICO`) — sempre move a linha inteira (não copia+edita), append no destino + delete na origem.
10. **Detecção de abas legado de histórico**: uma aba não-oficial entra na varredura de histórico se tiver `INFLU_KEY` no cabeçalho **e** (nome contém "HISTÓRICO", normalizado) **ou** (cabeçalho com assinatura completa `MES_REFERENCIA`+`STATUS_CONTEUDO`/`STATUS_PAGAMENTO`).
11. **Limpeza do histórico oficial** (`limparHistoricoOficial()`): ação manual, irreversível, decisão do usuário de abandonar histórico legado migrado — histórico oficial passa a existir só a partir dos envios feitos depois da correção de 2026-07-06.

---

## 7. Banco de dados

Único "banco": a planilha Google `[JESCRI] INFLUÊNCIA 360º`. Não há schema SQL — a estrutura é inferida por cabeçalho de coluna (linha 1 de cada aba), majoritariamente resolvida por nome (`getHeaderMap()`), com uma exceção crítica documentada abaixo.

### Abas e seus papéis

| Aba | Papel | Resolução de coluna |
|---|---|---|
| `BASE DE DADOS` | Cadastro mestre de influenciadoras | **Índice fixo** (`MAP.BASE`, `WebApp.js` ~L30-45) — única exceção no sistema |
| `CADASTROS` | Zona de pouso do Google Form externo | `getHeaderMap()` |
| `BRIEFING` | Conteúdo criativo por influenciadora/mês/formato | Mista: `MAP.BRIEFING` fixo para `INFLU_KEY`/`CUPOM`/`MES`/`RESUMO`; índices fixos 12-15 hardcoded para `SOBRE_REEL/CARROSSEL/STORIES_1/STORIES_2` |
| `FLUXO LOGÍSTICO` | Rastreamento logístico | `getHeaderMap()` |
| `ATIVAÇÕES` | Unidade de trabalho central (peça de conteúdo) | `getHeaderMap()` — colunas: `ID`, `INFLU_KEY`, `MES_REFERENCIA`, `ANO_REFERENCIA`, `FORMATO`, `DATA_APROVACAO`, `DATA_ATIVACAO`, `STATUS_CONTEUDO`, `LINK_ARQUIVO` |
| `PAGAMENTOS` | Controle financeiro | `getHeaderMap()` — colunas: `INFLU_KEY`, `MES_REFERENCIA`, `ANO_REFERENCIA`, `VALOR_TOTAL`, `CHAVE_PIX`, `STATUS_PAGAMENTO`, `DATA_PAGAMENTO`, `MENSAGEM_PIX` |
| `HISTÓRICO DE CONTEÚDOS` | Arquivo de `ATIVAÇÕES` | mesmas colunas + `DATA_ARQUIVAMENTO` |
| `HISTÓRICO DE PAGAMENTOS` | Arquivo de `PAGAMENTOS` | mesmas colunas + `DATA_ARQUIVAMENTO` |
| `HISTÓRICO LOGÍSTICO` | Arquivo de `FLUXO LOGÍSTICO` | mesmas colunas + `DATA_ARQUIVAMENTO` — **sem nenhuma leitura conhecida no código** |
| Abas legado (nome variável) | Histórico anterior à consolidação | Detecção dinâmica por assinatura de cabeçalho |

### `MAP.BASE` — risco de índice fixo (ver `SYSTEM_TRUTH.md` seção 4)

```
INFLU_KEY=2, CUPOM=3, NOME(RAZAO_SOCIAL)=4, EMAIL=5, CHAVE_PIX=6,
CNPJ=7, CEP=8, RUA=9, NUMERO=10, COMPLEMENTO=11, CIDADE=13, UF=14, VALOR=16
```
Inserir/remover coluna em `BASE DE DADOS` quebra `login()`/`getPerfil()`/`updatePerfil()` silenciosamente. Mitigado parcialmente por `SchemaExporter.js:verificarIntegridadeSistema()`, que compara o cabeçalho real contra o esperado — mas isso é detecção pós-fato, não prevenção.

### Fonte de verdade do schema completo por aba

`mae/SchemaExporter.js` gera `SYSTEM_SCHEMA.json`/`SYSTEM_SCHEMA.md` **direto da planilha viva** (via `SpreadsheetApp`), na mesma pasta do Drive da planilha — é a única fonte que reflete a estrutura real a qualquer momento, sem depender de documentação estática. Rodado via menu, `onEdit` (debounce 20s), trigger de tempo (15min), e ao fim de `gerarNovoMesCompleto()`.

---

## 8. APIs

Não há API REST formal documentada (sem OpenAPI/Swagger). Duas superfícies:

### 8.1. `google.script.run` (caminho real usado por `Index.html`)

Chamado diretamente do front-end via `chamar()`/`chamarServidorBruto()` (`Index.html` ~L912-936), que envolve `google.script.run` numa Promise. Funções expostas (todas em `WebApp.js`, exceto onde indicado):

`login`, `logout`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `listarPeriodos`, `iniciarEnvioResumable`, `finalizarEnvioResumable`.

### 8.2. `doPost` + `API_ACOES` (shim JSON, `WebApp.js` ~L179-212)

Endpoint JSON aditivo (`Content-Type: text/plain` para evitar preflight CORS), corpo `{"action": "...", ...params}`. Espelha as mesmas 11 funções acima. **Não é usado pelo `Index.html` atual** (que usa `google.script.run` diretamente) — foi pensado para um SPA hospedado separadamente que nunca chegou a existir com este contrato. Ver seção 16 (dívidas técnicas).

### 8.3. `doGet` — dois comportamentos

- Sem parâmetros (ou `mode` diferente de `qa`, ou token errado): serve `Index.html` como Web App normal.
- `?mode=qa&token=<token>`: se o token bater com o gerado via `configurarTokenQA()` (menu ERP), executa `runQA_E2E()` (QA Shadow) e retorna JSON. Sem token certo, cai no comportamento padrão — **nenhuma mudança para usuário real**.

### 8.4. APIs externas consumidas

| API | Uso | Onde |
|---|---|---|
| BrasilAPI (`brasilapi.com.br/api/cep/v1/`) | Preenchimento de endereço por CEP | `Código.js:preencherEnderecoPorCEP()` ~L715, `onFormSubmit()` ~L673 |
| BRComerce (`api.brcomerce.com.br/tracking/`) | Consulta de status de rastreio | `Código.js:atualizarRastreiosBRComerce()` ~L471 |
| Google Drive REST API (`googleapis.com/upload/drive/v3/files`) | Upload resumable de material | `WebApp.js:iniciarEnvioResumable()` ~L924 |

---

## 9. Autenticação e autorização

**Portal (influenciadoras)**:
- Autenticação própria (não Google Sign-In), independente do Apps Script — cupom + prefixo do CNPJ como senha.
- Sessão: token opaco (UUID) em `CacheService`, 6h, renovação deslizante.
- Autorização: cada função valida `validarToken()` e depois confere que a linha/ativação acessada pertence ao `influKey` do token (`ACESSO_NEGADO` se não bater) — ex. `getBriefing()`, `iniciarEnvioResumable()`, `finalizarEnvioResumable()`.
- Sem RBAC/papéis — todas as influenciadoras têm o mesmo nível de acesso (aos próprios dados apenas).

**ERP (equipe)**:
- Autorização = ser um editor da planilha Google (herdado do Google Workspace/Drive, fora do código). Não há papéis diferenciados dentro do ERP — qualquer editor tem acesso a todo o menu.
- `SidebarBackend.js` não faz verificação adicional de autorização — confia inteiramente no acesso à planilha.

**Web App (deploy)**: `executeAs: "USER_DEPLOYING"` + `access: "ANYONE_ANONYMOUS"` (`appsscript.json`) — o Web App roda com a identidade de quem fez o deploy, para **qualquer** visitante anônimo, mesmo sem conta Google. É assim que o Portal funciona para influenciadoras sem precisar de login Google.

**QA Shadow**: token separado (`PropertiesService`, não versionado), protege `doGet(?mode=qa)`. Sem relação com a autenticação do Portal.

---

## 10. Integrações externas

| Sistema | Direção | Descrição |
|---|---|---|
| Google Drive | escrita | Pasta por influenciadora (raiz configurável via `PropertiesService`), subpastas por mês e formato, upload resumable direto |
| Google Form (`estudioela/estudioela`, repo separado) | entrada | Cadastro de novas influenciadoras, cai em `CADASTROS` |
| BrasilAPI | consulta | CEP → endereço completo |
| BRComerce | consulta | Rastreio de encomendas |
| Planilhas externas por influenciadora (`INFLU_SHEET_URL`) | consulta | Looks, via `sincronizarLooks()` |
| GitHub Pages (`pages-portal`) | hospedagem | Redirecionador iframe estático para `portal.estudioela.com` |
| `estudioela.com` (repo `estudioela/estudioela`, separado) | externo | Site institucional + formulário de cadastro — **fora deste repositório** |

---

## 11. Variáveis de ambiente

Não há arquivo `.env` — Apps Script não usa variáveis de ambiente tradicionais. Configuração persistente via `PropertiesService` (script-level):

| Chave | Uso | Onde definida |
|---|---|---|
| `PASTA_RAIZ_ENTREGAS` (`SCRIPT_PROP_PASTA_RAIZ`) | ID da pasta raiz do Drive para entregas (fallback: `PASTA_MAE_ID` hardcoded) | `WebApp.js` ~L7, ~L879 |
| `PASTA_DRIVE_<cupom>` | ID da pasta de Drive por influenciadora, cacheada | `WebApp.js:getIdPastaDriveCupom/setIdPastaDriveCupom` ~L660 |
| `QA_SHADOW_TOKEN` | Token de acesso ao endpoint QA Shadow | `QaShadow.js:configurarTokenQA()` ~L65 |
| `SCHEMA_EXPORT_ULTIMO_HASH` / `SCHEMA_EXPORT_ULTIMA_EXEC_MS` | Controle de debounce/skip do SchemaExporter | `SchemaExporter.js` ~L31-32 |

`appsscript.json` declara os `oauthScopes` (spreadsheets, drive, script.external_request, script.container.ui, script.scriptapp, script.storage) — não são "env vars" mas cumprem papel equivalente de configuração de ambiente de execução.

---

## 12. Componentes do front-end

`mae/Index.html` é um SPA de arquivo único, sem framework, com roteamento client-side manual. Estrutura:

**Telas (`<section class="tela">`)**:
1. `tela-login` — formulário cupom/senha
2. `tela-pendencias` — dashboard de ativações do mês, com seletor de período
3. `tela-briefing` — texto do briefing + resumo do mês + botão "enviar material"
4. `tela-upload` — 4 sub-estados: seleção de arquivo(s) → progresso → sucesso → erro
5. `tela-pagamentos` — totais do mês + tracker visual (PENDENTE→APROVADO→PAGO) por item
6. `tela-historico` — ativações + pagamentos históricos, agregados de abas oficiais e legado
7. `tela-perfil` — dados cadastrais (leitura) + campos editáveis + somente-leitura (cupom/valor)

**Navegação**: `nav-inferior` (4 abas fixas: pendências/pagamentos/histórico/perfil) + `router.navigate()` com lista de rotas válidas (`ROTAS_VALIDAS`) e permissões (`appState.permissions`, hoje sempre `true` para todas — não há controle de acesso por rota no front, é vestigial/preparação para o futuro).

**Estado global**: `STATE` (token, nome, ativação atual, arquivo(s) selecionado(s), períodos, índice de período por tela, cache de briefing) — em memória, nunca `localStorage` exceto o par `token`/`nome` para restauração de sessão (`persistirSessao()`).

**Camada de comunicação**: `chamar()`/`chamarServidorBruto()` — wrapper de `google.script.run` em Promise, com tratamento centralizado de `SESSAO_EXPIRADA` (desloga e mostra toast).

**Componentes visuais reutilizáveis**: cards de ativação (`.card`), pills de status (`.pill-*`), tracker de pagamento (`.tracker`), toast (`.toast`), seletor de mês (`.seletor-mes`).

**Design system embutido**: paleta de cores via CSS custom properties (`--primary: #8f0002`, tema "vinho"), tipografia (EB Garamond para display, Archivo Narrow para labels, Inter para corpo, Material Symbols Outlined para ícones), `text-transform:lowercase` global com exceções pontuais para maiúsculas (cupom, status, nomes).

**Upload resumable client-side**: `enviarArquivoResumable()` (~L1336) implementa o protocolo de upload resumable do Google Drive manualmente via `fetch` com `Content-Range`, chunk de 8MB, tratando resposta 308 (continuar) e 200/201 (concluído).

---

## 13. Serviços do back-end

| Arquivo | Papel | Principais funções |
|---|---|---|
| `mae/Código.js` | ERP — menu, automações de planilha, ciclo mensal | `onOpen`, `onEdit`, `onFormSubmit`, `gerarNovoMesCompleto`, `lancarPagamentosDoMes`, `gerarSolicitacaoPagamento`, `gerarMensagemRevisao`, `sincronizarLooks`, `atualizarRastreiosBRComerce`, `menuArquivarTudo`, `arquivarGenerico`, `preencherEnderecoPorCEP`, `organizarEPintarBase`, `getHeaderMap`, `montarLinha`, `setupERP`, `limparHistoricoOficial`, `limparTriggersOrfaos` |
| `mae/WebApp.js` | Backend do Portal | `doGet`, `doPost`, `login`, `validarToken`, `logout`, `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`, `getPerfil`, `updatePerfil`, `listarPeriodos`, `iniciarEnvioResumable`, `finalizarEnvioResumable`, `getInfluKeyByCupom(Cached)`, `listarAbasHistoricoLegado`, `normalizarStatusAtivacao`, `normalizarStatusPagamento` |
| `mae/SidebarBackend.js` | Backend das sidebars do ERP | `abrirSidebarInflu`, `abrirSidebarPagamento`, `getListaInfluenciadoras`, `getDadosInfluenciadora`, `salvarDadosSidebarV2`, `salvarPagamentoExtra` |
| `mae/PortalUi.gs` | Preview do Portal dentro da planilha | `abrirPortalModal` |
| `mae/SchemaExporter.js` | Schema vivo + checklist de integridade | `exportarSchemaCompleto`, `executarExportacaoSchema`, `gerarSchemaPlanilha`, `verificarIntegridadeSistema`, `instalarTriggersSchemaExporter(Interno/Headless)` |
| `mae/QaShadow.js` | Teste E2E de contrato, sem tocar produção | `runQA_E2E`, `validarIntegridadeRealQA`, `validarSchemaExporterRealQA`, simuladores (`simular*QA`), `configurarTokenQA`, `rodarQaShadowAgora`, headless equivalents |

---

## 14. Mapa de funcionalidades

### Portal (influenciadora)
- Login/logout com sessão persistente (localStorage) e expiração de 6h
- Dashboard de ativações pendentes, navegável por período (mês/ano real, não índice fixo)
- Visualização de briefing por ativação (texto + resumo do mês)
- Envio de material (multi-arquivo, upload resumable, progresso visual)
- Acompanhamento de pagamentos (totais do mês + tracker visual por item)
- Histórico consolidado (ativações + pagamentos, incluindo abas legado)
- Visualização e edição de perfil (5 campos editáveis)

### ERP (equipe/gestão)
- Geração de novo mês/campanha (briefing, ativações, fluxo logístico, pagamentos)
- Lançamento de pagamentos avulsos do mês
- Geração de mensagem de cobrança PIX (para WhatsApp)
- Geração de mensagem de confirmação de dados (endereço/PIX, para WhatsApp)
- Sincronização de looks a partir de planilhas externas por influenciadora
- Atualização automática de rastreios via API BRComerce
- Arquivamento automático (via edição) e manual (via menu) de ativações/pagamentos/logística concluídos
- Preenchimento automático de endereço por CEP (BrasilAPI)
- Organização e coloração visual da base de influenciadoras por status
- Sidebar de edição de dados da influenciadora (cupom, valor, quantidades, looks)
- Sidebar de lançamento de pagamento extra/UGC
- Preview do Portal em modal dentro da planilha
- Limpeza definitiva do histórico oficial (ação irreversível, com confirmação)
- Remoção de triggers órfãos
- Setup estrutural (criação de abas operacionais/histórico faltantes)
- Exportação de schema vivo da planilha (JSON + Markdown) com checklist de integridade
- QA Shadow (teste E2E de contrato, token protegido)

---

## 15. Dependências críticas

1. **`scriptId` único** (`mae/.clasp.json`) — todo o sistema depende deste projeto Apps Script específico.
2. **Planilha `[JESCRI] INFLUÊNCIA 360º`** — única fonte de dados; nomes exatos de abas (`SETUP.ABAS`/`MAP.*.NOME_ABA`) precisam bater com a planilha viva.
3. **`MAP.BASE`** (índice fixo) — dependência estrutural frágil, única exceção ao padrão `getHeaderMap()`.
4. **Deployment fixa do Web App** (`AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA`, hoje `@32`) — `clasp push` só atualiza HEAD; mudanças em produção exigem `clasp deploy -i` explícito.
5. **Branch `pages-portal`** — origem ao vivo de `portal.estudioela.com`, sem staging, mudanças afetam produção imediatamente.
6. **Triggers instaláveis** (`onFormSubmit`, `onEdit` do SchemaExporter) — configurados fora do código-fonte, não verificáveis por leitura de repositório.
7. **APIs externas** (BrasilAPI, BRComerce) — sem fallback caso fiquem indisponíveis (falhas são engolidas silenciosamente em `try/catch` vazios).
8. **Repositório `estudioela/estudioela`** (formulário de cadastro, site institucional) — fora deste repo, mas parte do fluxo de cadastro.
9. **`PASTA_MAE_ID` hardcoded** (`WebApp.js` ~L831) — fallback fixo se `PropertiesService` não tiver a pasta raiz configurada.

---

## 16. Dívidas técnicas

1. **`API_ACOES`/`doPost` shim (`WebApp.js` ~L179-212)**: espelha 11 funções para um consumo JSON que **não é usado** pelo `Index.html` atual (que usa `google.script.run` diretamente). É superfície morta que precisa ser mantida manualmente em sincronia — já divergiu uma vez (faltavam `iniciarEnvioResumable`/`finalizarEnvioResumable`, corrigido em 2026-07-05). Ou remover, ou adotar de fato, mas mantê-lo como está é dívida pura.
2. **`MAP.BASE` por índice fixo** — única exceção ao padrão do resto do código. Recomendação de migração para `getHeaderMap()` já registrada em `SYSTEM_TRUTH.md` seção 4 (recomendado, não decidido).
3. **`onEdit()` (`Código.js` ~L184) engole todos os erros silenciosamente** (`catch(err){}`, sem `Logger.log`) — qualquer bug futuro nas automações (BRIEFING, ATIVAÇÕES, PAGAMENTOS, FLUXO) falha sem deixar rastro algum, dificultando diagnóstico. `onFormSubmit()` (~L646) tem o mesmo padrão (`catch(fatalError){}`, sem log).
4. **Acoplamento posicional entre abas live e histórico** (`arquivarGenerico()`, `Código.js` ~L611-641): copia a linha inteira por posição de coluna, assumindo que `ATIVAÇÕES`↔`HISTÓRICO DE CONTEÚDOS` (e os outros dois pares) têm exatamente a mesma ordem de colunas. Reordenar colunas em só uma das abas do par quebra silenciosamente o arquivamento (dados caem na coluna errada).
5. **`BRIEFING` sem `ANO_REFERENCIA`**: `getBriefing()` casa por `MES` apenas — duas campanhas do mesmo mês em anos diferentes colidiriam (ressalva já registrada em `SYSTEM_MAP.md`).
6. **Índices hardcoded para colunas de briefing por formato** (`getBriefing()`, `WebApp.js` ~L404-410 e `onEdit()`, `Código.js` ~L263-267): fallback fixo para colunas 12-15/17-20 quando `getHeaderMap()` não encontra o nome esperado — mistura os dois padrões (nome vs. posição) na mesma função.
7. **Nenhum pipeline de CI** — testes (QA Shadow) e exportação de schema dependem de execução manual (menu) ou triggers configurados fora do repositório; não há verificação automática antes de merge.
8. **`HISTÓRICO LOGÍSTICO`**: nunca lido por nenhuma função conhecida — é escrita pura sem consumo, potencial código morto ou funcionalidade nunca finalizada.
9. **Sem testes automatizados de front-end** — QA Shadow testa contrato do backend; `Index.html` não tem nenhuma cobertura automatizada.

---

## 17. Riscos

Consolidado (a maioria já registrada em `SYSTEM_TRUTH.md` seção 5 — repetido aqui por completude do documento único):

1. **`MAP.BASE` (índice fixo)** — risco #1 do sistema, quebra silenciosa de login/perfil.
2. **Triggers instaláveis não verificáveis por código** (`onFormSubmit`, SchemaExporter) — dependem de instalação manual, sem forma de confirmar por leitura de repositório se estão ativos.
3. **`doGet(?mode=qa)`** — ramo condicional num Web App público/anônimo; protegido por token, mas é superfície de código adicional em produção.
4. **Deployment pinada por versão** — mudanças em `WebApp.js`/`Index.html` não chegam a produção sem `clasp deploy` explícito; risco de "já corrigi no código mas não está no ar".
5. **Sem ambiente de staging técnico real** — só há separação de branches de código; qualquer deploy real é contra a planilha/produção única.
6. **Baixa entropia de senha por design** — aceito, mas exposto (bloqueio só por cupom, não global — um atacante pode tentar cupons diferentes em paralelo sem acionar o bloqueio de um cupom específico).
7. **Token de sessão em `localStorage`** — sobrevive ao fechar a aba/navegador; em dispositivo compartilhado, sessão de 6h pode ser retomada por outra pessoa sem novo login.
8. **Falhas de API externa (BrasilAPI/BRComerce) engolidas silenciosamente** (`try/catch` vazios em `Código.js`) — endereço/rastreio simplesmente não é preenchido, sem sinalização de erro para a equipe.
9. **`clasp run` não funciona neste projeto** — investigado a fundo, causa raiz documentada (devMode exige dono do script). Automação de funções de menu continua exigindo execução manual pela UI.
10. **Sem monitoramento/alerta ativo** — dependência de `Logger.log`/Execution Log revisado manualmente (foi assim que o trigger órfão foi descoberto, só depois de gerar erro recorrente por horas).

---

## 18. Bugs potenciais identificados durante a leitura

### 18.1. 🔴 Dupla formatação de data — dia e mês trocados na UI para a maioria das datas (NOVO, não documentado anteriormente)

**Onde**: `WebApp.js:formatarData()` (~L815-821) formata `Date` → string `"dd/MM/yyyy"` (formato brasileiro) antes de enviar ao front-end, para **todo** campo de data (`dataEntrega`, `dataAprovacao`, `dataPagamento`, etc., em `getPendencias`, `getBriefing`, `getPagamentos`, `getHistorico`).

`Index.html:formatarData()` (~L1043-1058) recebe essa string e, por ser `typeof valor === 'string'`, executa `new Date(valor)` — mas o construtor `Date()` do JavaScript interpreta strings no formato `M/D/YYYY` (**americano**), não `DD/MM/YYYY`.

**Efeito concreto**: para qualquer data em que o dia seja ≤ 12 (a maioria dos dias do mês), dia e mês são silenciosamente trocados na exibição. Exemplo: uma `DATA_APROVACAO` real de **5 de julho de 2026** chega ao front como `"05/07/2026"`; `new Date("05/07/2026")` é interpretado como **7 de maio de 2026**; o front então reformata e exibe **"07/05/2026"** — data errada, sem nenhum erro visível.

Quando o dia é > 12 (ex. "25/07/2026"), `new Date()` recebe um "mês 25" inválido, retorna `Invalid Date`, e o código cai no fallback `if(isNaN(d.getTime())) return valor;` — nesse caso (por acidente, não por design) a string original correta é exibida sem reformatação.

**Impacto**: todas as datas mostradas no Portal (cards de pendências — "Entrega"/"Postagem", briefing, histórico, data de pagamento) estão erradas (dia/mês trocados) sempre que o dia do mês é 1-12 — aproximadamente 39% de todas as datas possíveis, incluindo praticamente todo mês (dias 1 a 12 sempre existem). Nenhum erro é lançado; a interface simplesmente mostra uma data plausível e errada.

**Correção sugerida (não aplicada — fora do escopo desta auditoria)**: ou o backend para de pré-formatar como string BR e envia `Date`/ISO puro (o `google.script.run` serializa `Date` nativamente), ou o front-end passa a fazer *parse* explícito do formato `dd/MM/yyyy` em vez de `new Date(string)`.

**(Corrigido em 2026-07-06/07, sessão posterior a esta auditoria)**: `Index.html:formatarData()` foi ajustada para fazer *parse* explícito do formato `dd/MM/yyyy` (a opção sugerida acima, sem mudar o contrato de `WebApp.js`) em vez de `new Date(string)` — elimina a interpretação como formato americano `M/D/YYYY` e, com ela, a troca silenciosa de dia/mês. Coberto por teste de regressão dedicado (`test/index-front-puras.test.js`), escrito via TDD reproduzindo exatamente o bug documentado acima (teste vermelho antes da correção, verde depois). A correção foi enviada ao projeto Apps Script real via `clasp push` e conferida byte-a-byte via `clasp pull` num diretório temporário. **Deploy em produção concluído em 2026-07-07** (`clasp deploy -i`, versão `@34` "ERP 1.5", mesma URL pública) com autorização explícita do usuário — a presença do parse corrigido no HTML servido pela URL pública foi verificada por inspeção direta pós-deploy. O bug não está mais ativo para influenciadoras reais.

### 18.2. Cache de `influKey` por cupom pode ficar obsoleto (documentado como risco aceito no próprio código)

`getInfluKeyByCupomCached()` (`WebApp.js` ~L757-765) cacheia por 6h. Se o `CUPOM` de uma influenciadora mudar em `BASE DE DADOS` no meio de uma sessão ativa (não impedido por código), o cache mantém a associação antiga por até 6h. Risco baixo (mudança de cupom não é uma operação comum), mas real.

### 18.3. `arquivarGenerico()` — acoplamento posicional silencioso

Já listado como dívida técnica (seção 16, item 4) — reclassificado aqui como bug potencial porque o efeito, se disparado, é corrupção silenciosa de dados (linha migrada com valores nas colunas erradas), não apenas "feio".

### 18.4. `onEdit()`/`onFormSubmit()` silenciam exceções sem log

Já listado em dívidas técnicas (item 3) — do ponto de vista de bug, significa que **qualquer regressão futura nessas automações não gera nenhum sintoma visível** além do comportamento ausente (ex.: briefing não é propagado, endereço não é preenchido) — dificulta diagnosticar quando (não apenas se) algo quebrar.

### 18.5. `getBriefing()` — colisão potencial entre anos (ressalva já registrada)

Casa `BRIEFING` só por `MES` (sem ano) — duas campanhas de "AGOSTO" em anos diferentes leriam o mesmo registro de briefing. Não é um bug ativo hoje (não observado em produção), mas é uma lacuna estrutural real.

### 18.6. Front-end: `router.permissions` sempre `true` (código vestigial)

`appState.permissions` (`Index.html` ~L892) declara permissões por rota, mas todas são sempre `true` — não há nenhum caminho de código que as altere. Não é um bug funcional (não há controle de acesso a fazer, hoje todas as influenciadoras têm acesso igual), mas é código morto que sugere uma funcionalidade planejada e nunca implementada — risco de alguém assumir que existe controle de acesso por rota quando não existe.

---

## 19. Checklist completa das funcionalidades existentes

### Portal (influenciadora)
- [x] Login com cupom + senha (prefixo do CNPJ)
- [x] Bloqueio por tentativas (5/15min, por cupom)
- [x] Sessão persistente entre recarregamentos (localStorage + token 6h)
- [x] Logout
- [x] Dashboard de pendências com seletor de período (mês/ano real)
- [x] Visualização de briefing (texto por formato + resumo do mês)
- [x] Envio de material multi-arquivo (foto/vídeo) com upload resumable e barra de progresso
- [x] Tratamento de erro de upload com opção de tentar novamente
- [x] Tela de pagamentos com totais do mês (previsto/pago) e tracker visual
- [x] Histórico de ativações e pagamentos (incluindo abas legado detectadas dinamicamente)
- [x] Visualização de perfil (dados cadastrais)
- [x] Edição de perfil (chave PIX, e-mail, CEP, número, complemento)
- [x] Navegação inferior fixa entre as 4 seções principais

### ERP (equipe)
- [x] Menu customizado na planilha (`onOpen`)
- [x] Geração de novo mês/campanha completo (briefing + ativações + fluxo + pagamentos)
- [x] Lançamento de pagamentos avulsos do mês
- [x] Geração de mensagem de cobrança PIX
- [x] Geração de mensagem de confirmação de dados (WhatsApp)
- [x] Sincronização de looks de planilhas externas por influenciadora
- [x] Atualização automática de rastreios (API BRComerce)
- [x] Arquivamento automático (via edição de status) de ativações/pagamentos/logística
- [x] Arquivamento manual em lote (menu "Limpeza e Arquivamento Geral")
- [x] Preenchimento automático de endereço por CEP (BrasilAPI), manual e via `onEdit`
- [x] Organização/coloração automática da base por status ON/OFF
- [x] Sidebar de edição de dados da influenciadora
- [x] Sidebar de lançamento de pagamento extra/UGC
- [x] Preview do Portal em modal dentro da planilha
- [x] Limpeza definitiva do histórico oficial (irreversível, com confirmação)
- [x] Remoção de triggers órfãos
- [x] Setup estrutural (criação de abas faltantes)
- [x] Exportação de schema vivo (JSON + Markdown) com checklist de integridade
- [x] QA Shadow (teste E2E de contrato) via menu e via endpoint protegido por token
- [x] Cadastro automático de nova influenciadora via Google Form (`onFormSubmit`)

### Não implementado / vestigial
- [ ] Controle de acesso por rota no front-end (código existe, mas todas as permissões são sempre `true`)
- [ ] API JSON (`doPost`/`API_ACOES`) usada de fato por algum cliente real
- [ ] Testes automatizados de front-end
- [ ] Pipeline de CI/CD

---

## 20. Recomendações para evolução futura

1. **Corrigir a dupla formatação de data (seção 18.1)** — é o achado de maior impacto direto ao usuário desta auditoria (datas erradas visíveis na UI para a maioria dos dias do mês). Recomendo tratar como prioridade, isolado em seu próprio PR, validado via QA Shadow + teste manual antes do merge.
2. **Migrar `MAP.BASE` para `getHeaderMap()`** — já recomendado em `SYSTEM_TRUTH.md`, ainda pendente de decisão do usuário. Reforço a recomendação: elimina a maior fonte de risco de quebra silenciosa do sistema.
3. **Decidir o destino do shim `doPost`/`API_ACOES`**: removê-lo (se não há plano de usá-lo) ou adotá-lo formalmente (se há plano de um cliente externo) — hoje é uma superfície de manutenção sem uso real.
4. **Adicionar `Logger.log` nos `catch` silenciosos de `onEdit()`/`onFormSubmit()`** — não muda comportamento para o usuário, mas transforma bugs invisíveis em bugs diagnosticáveis via Execution Log.
5. **Adicionar `ANO_REFERENCIA` a `BRIEFING`** para eliminar a colisão potencial entre campanhas do mesmo mês em anos diferentes.
6. **Considerar pipeline de CI mínimo** — mesmo sem testes de front-end, rodar QA Shadow automaticamente (via `clasp` + Apps Script API, respeitando a limitação documentada de `clasp run`) antes de merge em `main` reduziria dependência de execução manual.
7. **Reavaliar `HISTÓRICO LOGÍSTICO`** — se de fato não tem consumo, decidir entre implementar uma leitura (relatório de logística) ou documentar deliberadamente como "write-only por design".
8. **Formalizar processo de deploy** — hoje o `clasp push`/`clasp deploy` é inteiramente manual e mencionado em vários lugares como fonte de risco ("já corrigi mas não fiz deploy"). Um checklist curto (ou script) de deploy reduziria esse risco operacional.
9. **Revisar retenção de sessão em `localStorage`** — se dispositivos compartilhados forem um cenário real de uso, considerar reduzir a duração do token ou adicionar confirmação de logout ao trocar de usuário.

---

## Resumo executivo

O sistema é coerente, bem documentado (a documentação de apoio pré-existente — `CLAUDE.md`/`FLOW.md`/`SYSTEM_TRUTH.md`/`SYSTEM_MAP.md` — está em boa sintonia com o código real, com divergências já sinalizadas e a maioria corrigida) e funcional em produção. Arquitetura simples e direta: um único projeto Apps Script, uma planilha como banco de dados, front-end vanilla sem framework — sem complexidade acidental além do que a plataforma impõe (limitações de triggers, `clasp run`, deployment pinada).

O achado mais relevante desta auditoria, **não documentado anteriormente**: uma dupla formatação de data (`WebApp.js` formata para string `dd/MM/yyyy`, e `Index.html` reprocessa essa string com `new Date()`, que interpreta no formato americano `M/D/YYYY`) faz com que **toda data exibida no Portal apareça com dia e mês trocados sempre que o dia é ≤ 12** — a maioria dos casos reais. Isso afeta pendências, briefing, histórico e datas de pagamento, silenciosamente, sem gerar nenhum erro visível.

Os demais riscos e dívidas técnicas já eram conhecidos e estão documentados (índice fixo em `MAP.BASE`, triggers não verificáveis por código, deployment pinada, ausência de staging real, shim `doPost` não utilizado). Nenhuma alteração foi feita nesta sessão de auditoria — a correção veio numa sessão posterior: o achado principal (seção 18.1, dupla formatação de data) já foi corrigido e coberto por teste de regressão (`test/index-front-puras.test.js`), com a correção sincronizada com o projeto Apps Script real via `clasp push` (verificado byte-a-byte via `clasp pull`) e **deployada em produção em 2026-07-07** (versão `@34` "ERP 1.5", mesma URL pública, com autorização explícita do usuário) — a versão pública já reflete essa correção, verificada por inspeção do HTML servido pós-deploy.
