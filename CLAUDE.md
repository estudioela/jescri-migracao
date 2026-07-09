# CLAUDE.md — Mapa técnico do repositório

> Otimizado para agentes de IA. Não é documentação para humanos. Toda referência aponta pra arquivo/função real — linhas conferidas em 2026-07-05, podem ter driftado; se driftarem, `grep -n "^function NOME"` no arquivo indicado resolve.

## 1. Visão geral (10 linhas)

Projeto único: ERP + Portal de Influenciadoras Jescri, um só projeto Google Apps Script (`mae/`), versionado neste repo Git, deployado via `clasp`. `mae/Código.js` é o ERP (roda dentro da Planilha Google, menu customizado). `mae/WebApp.js` é o backend do Portal (Web App público, `doGet` — `doPost`/`API_ACOES` foram removidos em 2026-07-07, shim de API JSON nunca usado pelo `Index.html` real, que sempre chamou `google.script.run` diretamente). `mae/Index.html` é o front-end do Portal (SPA de um arquivo só, sem framework). Planilha Google = único banco de dados; Portal só lê/escreve nela via Apps Script, não existe banco separado. `docs/` é documentação (inclusive referência visual do Stitch, em `docs/design-reference/`); `sites/` está vazio (placeholder oficial pra sites auxiliares, ver `PROJECT_GOVERNANCE.md`) — nenhum dos dois faz parte do app, não abrir por padrão. `portal.estudioela.com` é servido por GitHub Pages **deste mesmo repositório**, branch `pages-portal` (não a `main`).

## 2. Mapa de arquitetura real

**Backend (Apps Script, roda no Google):**
- `mae/Código.js` — ERP: menu (`onOpen`), automações da planilha (`onEdit`, `onFormSubmit`), ciclo mensal, arquivamento, sincronização de looks.
- `mae/WebApp.js` — Portal: `doGet` (inclui `?mode=qa`; `doPost`/`API_ACOES` removidos em 2026-07-07), todas as funções chamadas via `google.script.run` pelo front-end, `MAP` (mapeamento de colunas — `MAP.BASE` migrou de índice fixo para `getHeaderMap()` em 2026-07-07, hoje só guarda `NOME_ABA`).
- `mae/PortalUi.gs` — só `abrirPortalModal()`, abre `Index.html` num modal dentro da planilha.
- `mae/SidebarBackend.js` — backend das sidebars do ERP (dados de influenciadora, pagamento extra).
- `mae/SchemaExporter.js` — SCHEMA_EXPORTER: gera `SYSTEM_SCHEMA.json`/`SYSTEM_SCHEMA.md` (estrutura real da planilha, direto via `SpreadsheetApp`/`ScriptApp`, versionado por hash SHA-256). Roda via menu (" 📄 Schema Vivo"), via `onEdit` instalável com debounce, via trigger de tempo, e ao final de `gerarNovoMesCompleto()`. Triggers instaláveis exigem rodar `instalarTriggersSchemaExporter()` uma vez (menu) — restrição de plataforma, não pendência de código.
- `mae/QaShadow.js` — QA_SHADOW: camada de teste E2E sem tocar produção. `runQA_E2E()` simula fluxo de influenciadora/gestor por **contrato** (fixtures no formato real, não executa `login()`/upload/histórico de verdade — decisão deliberada pra não arriscar código de autenticação); só `validarIntegridadeRealQA()`/`validarSchemaExporterRealQA()` rodam contra dados reais, e são somente-leitura. Acessível via menu (" 🧪 QA Shadow") ou `doGet(?mode=qa&token=...)` em `mae/WebApp.js`, protegido por token gerado via `configurarTokenQA()` (menu) e guardado em `PropertiesService` — sem token certo, `doGet` serve o Portal normalmente (nenhuma mudança de comportamento pra usuário real).
- `mae/appsscript.json` — manifest: timezone, oauthScopes, config do Web App (`executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS`), `executionApi.access: ANYONE` (habilitado 2026-07-05 pra tentar `clasp run` — ver risco abaixo, continua não funcional em produção).

**Frontend (Portal, roda no navegador da influenciadora):**
- `mae/Index.html` — arquivo único: todo HTML+CSS+JS do Portal (shell único, todas as telas, router client-side). Não existem mais `PortalApp.html`, `views_*.html`, `components_*.html` — foram consolidados aqui.
- `mae/Sidebar.html`, `mae/SidebarPagamento.html` — UI das sidebars do ERP (dentro da planilha, não do Portal).

**Sincronização / deploy:**
- `mae/.clasp.json` — `scriptId: 1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`, `rootDir: ""` (relativo a `mae/`). Deploy = `cd mae && clasp push`.
- Domínio do Portal (`portal.estudioela.com`) NÃO é servido por Apps Script diretamente — é um redirecionador estático (iframe) publicado via GitHub Pages na branch `pages-portal` **deste repo** (não existe na `main`; ver seção 5).

**Testes / CI (desde 2026-07-07):**
- `test/` — suíte Jest (156 testes, execução direta do código GAS real via `vm`, sem mocks pesados) cobrindo os fluxos críticos do ERP/Portal. Rodar com `npm test` (ou `npx jest`). Plano de testes detalhado: `docs/PLANO_DE_TESTES_QA.md`.
- `.github/workflows/tests.yml` — CI mínimo no GitHub Actions, roda essa suíte em PRs/push para `main`.

## 3. Mapa de arquivos críticos

- **Login**
  arquivo: `mae/WebApp.js`, função `login()` (~L153)
  não mexer: comparação de senha (prefixo do CNPJ) e o bloqueio por tentativas (`LOGIN_MAX_TENTATIVAS`/`LOGIN_BLOQUEIO_SEGUNDOS`, topo do arquivo) sem entender que a "senha" tem baixa entropia por design.
  pode alterar: mensagens de erro, desde que continuem em `{ok:false, erro:"CODIGO"}` — o front-end (`mae/Index.html` `fazerLogin()` ~L1068) faz `switch` por esses códigos (`CREDENCIAIS_INVALIDAS`, `MUITAS_TENTATIVAS`).

- **Logout / sessão**
  arquivo: `mae/WebApp.js`, funções `logout()` (~L223), `validarToken()` (~L210)
  não mexer: `logout()` sem atualizar `sairDoApp()` em `mae/Index.html` (chama `google.script.run.logout(token)` fire-and-forget).
  pode alterar: duração do token (hoje 21600s / 6h, hardcoded em `login()` e `validarToken()`).

- **Menu do ERP**
  arquivo: `mae/Código.js`, função `onOpen()` (~L25)
  não mexer: nomes das funções nos `.addItem(label, "nomeFuncao")` sem confirmar que a função existe — item de menu quebrado é silencioso até alguém clicar.
  pode alterar: labels e organização dos submenus livremente.

- **Ciclo mensal (criação de campanha)**
  arquivo: `mae/Código.js`, função `gerarNovoMesCompleto()` (~L70)
  não mexer: ordem das colunas passadas a `montarLinha()` sem conferir `getHeaderMap()` da aba de destino — é resolvido por nome de cabeçalho, não por posição.
  pode alterar: lógica de quantidade de ativações por formato (REEL/CARROSSEL/STORIES).
  desde 2026-07-07: também grava `ANO_REFERENCIA` em novas linhas de `BRIEFING` (condicional à coluna existir — ver `garantirColunaAnoReferenciaBriefing()` abaixo).

- **Limpeza definitiva do histórico oficial (2026-07-06, ação manual, irreversível)**
  arquivo: `mae/Código.js`, função `limparHistoricoOficial()`, menu " ERP ELÃ 6.2 → Cadastros & Configurações → 7. ⚠️ Limpar Histórico Oficial"
  não mexer: sem entender que apaga (com confirmação `ui.alert` antes) todas as linhas de dados de `HISTÓRICO DE CONTEÚDOS`/`HISTÓRICO DE PAGAMENTOS`, mantendo só o cabeçalho — decisão do usuário de abandonar o histórico legado migrado, histórico oficial passa a ser só os envios feitos a partir desta correção. Não toca abas legado de nome variável (essas continuam existindo, só não fazem parte do escopo desta limpeza).
  pode alterar: texto do diálogo de confirmação.

- **Adicionar coluna ANO_REFERENCIA em Briefing (2026-07-07, ação manual, idempotente e não-destrutiva)**
  arquivo: `mae/Código.js`, função `garantirColunaAnoReferenciaBriefing()`, menu " ERP ELÃ 6.2 → Cadastros & Configurações → 9. Adicionar Coluna ANO_REFERENCIA em Briefing"
  não mexer: sem entender que ela cria a coluna `ANO_REFERENCIA` como última coluna do cabeçalho de `BRIEFING` (se ainda não existir, com confirmação `ui.alert` antes) — necessária para `getBriefing()`/`onEdit()` casarem registros de `BRIEFING` por `MES`+`ANO_REFERENCIA` (ver item "Briefing" abaixo). Sem a coluna, o casamento cai no comportamento legado (qualquer ano casa). **Executada em produção pelo usuário em 2026-07-07** (coluna criada na planilha viva); permanece disponível no menu por ser idempotente (re-executar é no-op seguro).
  pode alterar: texto do diálogo de confirmação.

- **Adicionar colunas ID/ANO_REFERENCIA em Ativações (2026-07-08, ação manual, idempotente e não-destrutiva)**
  arquivo: `mae/Código.js`, função `garantirColunasIdAnoAtivacoes()` (+ helpers `garantirColunasNaAba_`/`backfillIdAnoAba_`/`derivarAnoDaLinha_`), menu " ERP ELÃ 6.2 → Cadastros & Configurações → 10. Adicionar Colunas ID/ANO em Ativações"
  não mexer: sem entender que a planilha viva tinha `ATIVAÇÕES` com só 7 colunas (sem `ID` nem `ANO_REFERENCIA` — descoberto via `SYSTEM_SCHEMA.md` real em 2026-07-07, divergindo da documentação da época), o que deixava inertes a resolução de linha por ID estável no upload (caía no fallback `ROWn`) e o casamento por ano. A migração cria as 2 colunas em `ATIVAÇÕES` **e** em `HISTÓRICO DE CONTEÚDOS` (o par precisa evoluir junto — ver `arquivarGenerico()` abaixo) e preenche só células vazias (ID = UUID novo, só na aba viva; ano derivado das datas da própria linha — em histórico sem data aproveitável, fica vazio, nunca chuta).
  pode alterar: textos dos diálogos.

- **Arquivamento (`arquivarGenerico()`) — cópia por NOME desde 2026-07-08**
  arquivo: `mae/Código.js`, função `arquivarGenerico()`
  não mexer: o mapeamento origem→destino por nome de cabeçalho sem entender o histórico: a cópia posicional antiga gravava valores na coluna errada quando os cabeçalhos do par divergiam — e divergiam de verdade em produção (`ATIVAÇÕES` col 7 = `LINK_ARQUIVO`; `HISTÓRICO DE CONTEÚDOS` col 7 = `DATA_ARQUIVAMENTO`: o link arquivado caía na coluna do carimbo, e o carimbo numa coluna 8 sem cabeçalho). Colunas da origem sem correspondente no destino são descartadas; destino sem cabeçalho cai no comportamento posicional antigo.
  pode alterar: mensagens de toast.

- **Briefing (resumo do mês)**
  arquivo: `mae/WebApp.js`, função `getBriefing()` (~L289)
  não mexer: fallback de coluna (`hBrief['RESUMO'] || ... || MAP.BRIEFING.RESUMO`) sem saber o cabeçalho real da aba BRIEFING; nem o casamento de registros de `BRIEFING` por `MES`+`ANO_REFERENCIA` (corrigido em 2026-07-07 — antes só `MES`, causava colisão entre campanhas do mesmo mês em anos diferentes). Linhas de `BRIEFING` com `ANO_REFERENCIA` vazia/ausente continuam casando com qualquer ano (compatibilidade legado). Mesmo casamento se aplica à propagação de `DATA_APROVACAO` em `mae/Código.js:onEdit()`.
  pode alterar: quais campos do briefing são retornados ao front-end.
  front-end: `mae/Index.html`, `abrirBriefing()` (~L1222), componente visual `.briefing-resumo` (CSS + markup, mesma seção).

- **Histórico (inclui abas legado)**
  arquivo: `mae/WebApp.js`, funções `getHistorico()` (~L441), `listarAbasHistoricoLegado()` (~L72)
  não mexer: a lista `nomesConhecidos` dentro de `listarAbasHistoricoLegado()` sem entender que ela existe pra EXCLUIR abas já processadas da varredura — remover um nome dali causa contagem duplicada de linhas.
  pode alterar: critério de detecção de aba legado (hoje: precisa ter `INFLU_KEY` + `MES_REFERENCIA` no cabeçalho).

- **Pagamentos (status/tracker)**
  arquivo: `mae/WebApp.js`, função `normalizarStatusPagamento()` (~L726)
  não mexer: sem atualizar `ETAPA_ORDEM`/`ETAPA_LABELS` em `mae/Index.html` (~L860) junto — os dois têm que usar o mesmo vocabulário (`PENDENTE`/`APROVADO`/`PAGO`).
  pode alterar: substrings reconhecidas (hoje: `"pago"`, `"aprovado"`).
  front-end: `.tracker{align-items:flex-start}` (CSS) — **não trocar pra `center`**, foi causa raiz de bug de alinhamento já corrigido.

- **Upload de material**
  arquivo: `mae/WebApp.js`, funções `iniciarEnvioResumable()` (~L822), `finalizarEnvioResumable()` (~L862)
  não mexer: resolução da linha por ID estável (`encontrarLinhaAtivacaoPorId()`, ~L636) — existia uma corrida real quando isso era feito por número de linha.
  pode alterar: tamanho de chunk do upload (`enviarArquivoResumable()` em `mae/Index.html` ~L1334, `CHUNK_SIZE`).

- **appsscript.json / .clasp.json**
  arquivos: `mae/appsscript.json`, `mae/.clasp.json`
  não mexer: `scriptId`, `executeAs`, `access` sem saber que isso reconfigura o deploy do Web App em produção.
  pode alterar: `oauthScopes` só se adicionar uma integração nova que precise.

## 4. Fluxos principais (caminho real do código)

- **Login**: `mae/Index.html:fazerLogin()` (~L1068) → `chamar('login',...)` (~L921) → `mae/WebApp.js:login()` (~L153) → aba `BASE DE DADOS`.
- **Dashboard/Pendências**: `mae/Index.html:carregarPendencias()` (~L1153) + `carregarPeriodos()` (~L1113) → `mae/WebApp.js:getPendencias()` (~L234) / `listarPeriodos()` (~L653) → aba `ATIVAÇÕES`.
- **Briefing**: `mae/Index.html:abrirBriefing()` (~L1222) → `mae/WebApp.js:getBriefing()` (~L289) → abas `ATIVAÇÕES` + `BRIEFING`.
- **Envio de material**: `mae/Index.html` (`arquivoSelecionado`/`iniciarEnvio`/`enviarArquivoResumable()` ~L1334) → `mae/WebApp.js:iniciarEnvioResumable()`/`finalizarEnvioResumable()` (~L822/862) → Drive (pasta por influenciadora via `PropertiesService`, não mais coluna na planilha) + aba `ATIVAÇÕES`.
- **Pagamentos**: `mae/Index.html:carregarPagamentos()` (~L1383) → `mae/WebApp.js:getPagamentos()` (~L376) → aba `PAGAMENTOS`.
- **Histórico**: `mae/Index.html:carregarHistorico()` (~L1440) → `mae/WebApp.js:getHistorico()` (~L441) → abas `HISTÓRICO DE CONTEÚDOS` + `HISTÓRICO DE PAGAMENTOS` + qualquer aba legado detectada.
- **Perfil**: `mae/Index.html:carregarPerfil()`/`salvarPerfil()` (~L1500/1526) → `mae/WebApp.js:getPerfil()`/`updatePerfil()` (~L524/575) → aba `BASE DE DADOS`.
- **Sincronização de looks (ERP, não é o Portal)**: `mae/Código.js:sincronizarLooks()` (~L411) — abre planilha externa **por influenciadora** (URL na própria `BASE DE DADOS`, coluna `INFLU_SHEET_URL`), não é a planilha de apoio antiga (essa foi removida, ver seção 6).
- **Cadastro de nova influenciadora**: formulário externo (Google Form, vive no repo `estudioela/estudioela`, não aqui) → aba `CADASTROS` → `mae/Código.js:onFormSubmit()` (~L544) → aba `BASE DE DADOS`. Depende de trigger instalável (não verificável por código, ver seção 6).

## 5. Dependências críticas

**Apps Script:**
- `scriptId`: `1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK` (`mae/.clasp.json`)
- Web App exec URL (embutida no redirecionador do domínio, branch `pages-portal`, arquivo `index.html`): `https://script.google.com/macros/s/AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA/exec`

**Abas da Planilha Google (nomes exatos, de `SETUP.ABAS` em `mae/Código.js` ~L7 e `MAP` em `mae/WebApp.js` ~L28):**
`BASE DE DADOS`, `CADASTROS`, `BRIEFING`, `FLUXO LOGÍSTICO`, `ATIVAÇÕES`, `PAGAMENTOS`, `HISTÓRICO DE CONTEÚDOS`, `HISTÓRICO DE PAGAMENTOS`, `HISTÓRICO LOGÍSTICO`. Mais qualquer aba legado com cabeçalho `INFLU_KEY`+`MES_REFERENCIA` (detecção dinâmica, não nome fixo).

**URLs externas:**
- `portal.estudioela.com` → GitHub Pages, **este repo** (`estudioela/jescri-migracao`), branch `pages-portal` (não `main`). Config: `gh api repos/estudioela/jescri-migracao/pages`.
- `estudioela.com` → GitHub Pages do repo **separado** `estudioela/estudioela` (site institucional; NÃO é este repositório).
- `estudioela/portal-influenciadoras` → repo antigo do redirecionador, GitHub Pages **desativado** (não excluído) em 2026-07-05. Backup completo em `~/Backups/portal-influenciadoras-backup-20260705-160436/` + tag `backup-pre-migracao-pages-20260705` no próprio repo. Exclusão do repo pendente de confirmação do usuário após alguns dias de observação.

## 6. Mapa de risco

- **(Corrigido em 2026-07-07) Ex-arquivo sensível — `mae/WebApp.js` `MAP.BASE`**: migrado de índice fixo de coluna para `getHeaderMap()` (resolução por nome), mesmo padrão já usado por `ATIVACOES`/`PAGAMENTOS`/`HISTORICO_*`. `MAP.BASE` hoje só guarda `NOME_ABA`; `login()`, `getPerfil()`, `updatePerfil()`, `getInfluKeyByCupom()`, `getNomeInfluByCupomCached()` resolvem colunas por nome de cabeçalho. **Risco eliminado**: inserir/remover coluna em `BASE DE DADOS` não quebra mais login/perfil silenciosamente — esse era o risco #1 documentado no sistema até esta correção.
- **(Resolvido em 2026-07-07) Padrão de resolução de coluna unificado**: TODAS as abas são resolvidas por nome de cabeçalho via `getHeaderMap()` — `BASE` migrou primeiro, `BRIEFING` por último (era o único remanescente com índice fixo para `INFLU_KEY`/`CUPOM`/`MES`/`RESUMO` e leituras hardcoded 12-15/17-20 em `getBriefing()`/`onEdit()`). `MAP.*` em `WebApp.js` hoje só guarda `NOME_ABA`. Unificação validada contra o cabeçalho real da planilha viva (via `SYSTEM_SCHEMA.md` do SchemaExporter): todos os nomes existem nas posições que os índices fixos assumiam — comportamento preservado. Nota: o cabeçalho real da coluna de resumo é `RESUMO_MES` (não `RESUMO`), resolvido pela cadeia de nomes em `getBriefing()`.
- **`onFormSubmit()`** (`mae/Código.js` ~L544): depende de trigger instalável configurado fora do código-fonte (painel de Triggers do Apps Script). Não há como confirmar por aqui se está de fato instalado.
- **Legado já removido** (não recriar): `Portal.js`, `Sincronizador.js`, `SincronizarPortal.js` — sincronizavam com uma "Planilha de Apoio" externa (ID `1289Eu3hk-...`) que foi descontinuada. `BASE DE DADOS` é fonte única desde então. Removidos do repo git há tempos, mas **continuavam vivos no projeto Apps Script em produção** (só sumiram de fato do script ao vivo em 2026-07-05, como efeito colateral de um `clasp push` a partir de `mae/`, que substitui o conteúdo remoto por completo). Se esses nomes de arquivo aparecerem em algum backup/branch antigo, não restaurar sem entender que o fluxo que eles implementavam não existe mais.
  - **(Corrigido em 2026-07-06) Trigger de tempo órfão**: a remoção desses arquivos legado deixou pra trás um trigger instalável (configurado fora do código-fonte, painel de Triggers) ainda chamando `sincronizarBaseDeApoio()` — função que não existe mais. Disparava a cada ~10min, gerando `"Script function not found"` recorrente no Execution Log desde 2026-07-05 (achado via `clasp logs`, não suposição). Corrigido com uma nova função de menu, `limparTriggersOrfaos()` (`mae/Código.js`, menu " ERP ELÃ 6.2 → Cadastros & Configurações → 8. Remover Triggers Órfãos") — remove qualquer trigger instalado apontando pra função inexistente no projeto atual, com confirmação antes. Ação manual (o usuário roda pelo menu quando quiser); eu não executo isso sozinho (mesma limitação de `clasp run` não funcionar neste projeto).
- **Incidente 2026-07-05 — projeto clasp duplicado na raiz**: chegou a existir um `.clasp.json` na raiz do repo (fora de `mae/`) apontando pro **mesmo `scriptId`** de produção, não versionado, com um `.claspignore` que ignorava `*.html` — um push a partir dali teria apagado todo HTML do Portal em produção. Havia também um `mae/PortalUi.js` (duplicata de `mae/PortalUi.gs`, mesma função `abrirPortalModal()`), que colidiria como o mesmo arquivo remoto no clasp. Ambos eram não-versionados (removidos sem perda de histórico). Por isso `mae/.claspignore` agora existe como allowlist explícita (só os arquivos legítimos, listados na íntegra em `mae/.claspignore`) — qualquer arquivo novo dentro de `mae/` só é enviado no push se for adicionado a essa lista.
- **`doGet(?mode=qa)`** (`mae/WebApp.js`): novo ramo condicional que só ativa com token correto (`mae/QaShadow.js:configurarTokenQA()`, guardado em `PropertiesService`, nunca no código). Sem token certo, cai no comportamento padrão — mas é, ainda assim, um novo ramo de código dentro do `doGet` público e anônimo (`ANYONE_ANONYMOUS`). Se mexer em `doGet`, confirmar que esse fallback continua incondicional pra qualquer requisição sem `mode=qa` ou com token errado.
- **`clasp run` não funciona neste projeto (2026-07-05, investigado a fundo, não tentar de novo sem motivo novo)**: mesmo com projeto GCP standard vinculado (`jescri-migracao`), Apps Script API habilitada nele, `executionApi.access: ANYONE` no manifest e implantação atualizada (`@27`), `clasp run` falha. Causa raiz confirmada por documentação oficial (`developers.google.com/apps-script/api/how-tos/execute`): `clasp run` usa `devMode: true` por padrão, e "only the owner of the script can execute it in development mode" — a conta autenticada (`elafashionmkt@gmail.com`) é editora, não dona (`clasp list-scripts` retorna vazio). `clasp run --nondev` contorna essa regra mas retorna 404 "Requested entity was not found" — sem causa documentada oficialmente pelo Google (só relatos de terceiros sugerindo usar o ID da implantação em vez do `scriptId` na chamada, não testável via `clasp` sem montar requisição HTTP manual, que foi deliberadamente evitado). Automação de funções de menu (`configurarTokenQA`, `instalarTriggersSchemaExporter`, `rodarQaShadowAgora` e as versões `*Headless`) continua exigindo execução manual pela UI do Apps Script/planilha.
- **(Resolvido, histórico — hipótese de autorização foi REFUTADA por teste real, 2026-07-06) Drive API estava desabilitada no projeto GCP vinculado**: `mae/appsscript.json` declara o escopo `https://www.googleapis.com/auth/drive`, mas `drive.googleapis.com` nunca tinha sido habilitada no projeto GCP standard vinculado (`jescri-migracao`, nº `607782229022`). Habilitada via `gcloud services enable drive.googleapis.com --project=jescri-migracao` — permanece habilitada. Suspeitou-se, com base em ausência de logs, que a autorização OAuth do deploy tivesse ficado presa e precisasse de reautorização manual — **essa hipótese foi testada e descartada**: um teste E2E real (login + upload completo com credencial de teste dedicada) mostrou tudo funcionando (`doGet`, `doPost`, `login()`, CORS, `iniciarEnvioResumable()`, e o arquivo de fato gravado no Drive). Não havia problema de autorização. A causa real do "Failed to fetch" era outra — ver o achado sobre `STATUS_CONTEUDO`/validação de dados logo abaixo. **Lição**: ausência de log recente não é prova de causa; só descarta hipóteses depois de reproduzir com teste real.
- **(Corrigido em 2026-07-06) Causa raiz real do "Failed to fetch" no upload: `STATUS_CONTEUDO` violava validação de dados da célula.** `finalizarEnvioResumable()` (`mae/WebApp.js`) gravava `"EM_APROVACAO"`, fora da lista aceita pela validação da célula (`em aberto`, `falta drive`, `aprovado`, `ajustes`, `postado` — confirmado pelo texto literal do erro do Google Sheets num teste real). O erro de validação escapa de qualquer `try/catch` (aplicado no flush diferido da planilha, não no `setValue()` síncrono), e o cliente recebe uma página de erro genérica do Apps Script em vez do JSON esperado. Corrigido gravando `"ajustes"` (decisão do usuário, dentro dos 5 valores já validados) — `normalizarStatusAtivacao()` ajustada para reconhecer `"ajuste"` e continuar exibindo "Em aprovação" na UI. Detalhe completo: `SYSTEM_TRUTH.md` seção 5, item 8; `FLOW.md` seção `STATUS_CONTEUDO`.
- **Pastas de backup que existiam na raiz** (`_archive_legacy_stitch/`, `_backup_cleanup_20260704_214648/` ~72M, `_backup_stitch_consolidacao_20260704/`): já estavam no `.gitignore` (nunca foram versionadas) — removidas da raiz em 2026-07-05, movidas para `~/Backups/jescri-migracao-root-cleanup-.../` (fora do repo, na máquina local). Histórico morto, não recriar.
- **`stitch_import/` (referência visual do Stitch)**: movido de `stitch_import/` (raiz) para `docs/design-reference/stitch-import/` em 2026-07-05, via `git mv` (histórico preservado). Atualizar este caminho se referenciar em outro lugar.
- **`sites/`**: hoje vazio (mirrors locais de `estudioela.com`/`portal-influenciadoras` foram removidos por serem espelhos sem uso). Não recriar sem necessidade real.

## 7. Zona proibida (não alterar sem confirmação explícita do usuário)

- `mae/.clasp.json` (`scriptId`) — aponta pro projeto Apps Script real em produção.
- `mae/appsscript.json` (`oauthScopes`, `webapp.executeAs`, `webapp.access`) — reconfigura permissões do deploy ao vivo.
- `MAP.BASE` em `mae/WebApp.js` — hoje só guarda `NOME_ABA` (colunas resolvidas por nome via `getHeaderMap()`, migração 2026-07-07); não renomear cabeçalhos de `BASE DE DADOS` sem atualizar as chaves lidas no código (`CUPOM`, `INFLUENCIADORA_RAZAO_SOCIAL`, `INFLUENCIADORA_CNPJ`, `EMAIL`, `CHAVE_PIX`, `CEP`, `RUA`, `NUMERO`, `COMPLEMENTO`, `CIDADE`, `UF`, `VALOR_TOTAL`).
- Nomes em `SETUP.ABAS` (`mae/Código.js`) e `MAP.*.NOME_ABA` (`mae/WebApp.js`) — têm que bater com o nome exato das abas na planilha viva.
- Qualquer coisa dentro de `_archive_*` / `_backup_*`.
- Repositórios `estudioela/estudioela` e `estudioela/portal-influenciadoras` — fora deste repo; não presumir autorização para modificar/excluir sem pedido explícito (histórico de decisão nesta sessão: ambos avaliados e mantidos deliberadamente).
- Branch `pages-portal` deste repo — é a origem ao vivo de `portal.estudioela.com`; mudanças nela afetam produção imediatamente (sem staging).

## 8. Guia de edição para agentes

- **Onde começar:** para qualquer tarefa em ERP/Portal, ler `mae/WebApp.js` inteiro primeiro (~900 linhas, cabe no contexto) antes de qualquer grep parcial — os contratos entre `mae/Index.html` e `mae/WebApp.js` só ficam claros vendo os dois completos.
- **Para saber nome de aba:** conferir `SETUP.ABAS` (`mae/Código.js` topo) E `MAP` (`mae/WebApp.js` topo) — os dois arquivos mapeiam nomes de aba independentemente, podem divergir.
- **Ignorar por padrão** (não abrir salvo pedido explícito): `docs/design-reference/` (referência visual do Stitch, não é código do app), `.claude/`, `.git/`.
- **`docs/`** é só documentação (inclusive este mapa não vive lá, vive na raiz) — não afeta runtime, não precisa ler pra entender o sistema.
- **`sites/`** está vazio — não explorar.
- **Antes de mexer em qualquer coisa de sessão/login/pagamento**, ler a seção 3 deste arquivo primeiro — evita reintroduzir bugs já corrigidos (histórico completo das correções: `git log --oneline -- mae/WebApp.js mae/Index.html`).

## 9. EXECUTION PROTOCOL (MANDATORY FOR ALL AGENTS)

> ⚠️ **Leia a seção 12 antes de aplicar esta seção.** Desde 2026-07-08, a **seção 12 (MODO V2 — EVOLUÇÃO AUTORIZADA)** suspende a proibição de exploração e de refatoração dentro de `mae/`, `test/` e `docs/`. Fora desse escopo, esta seção continua valendo.

> Este arquivo (`CLAUDE.md`) tem precedência sobre qualquer comportamento padrão do agente.

- Proibida a exploração livre do repositório. Nenhum agente deve varrer diretórios ou "descobrir" estrutura por conta própria.
- Toda tarefa começa pelo `FLOW.md` (mapa de fluxos) — é a primeira fonte consultada, antes deste arquivo ou de qualquer arquivo de código.
- Toda edição só pode partir de caminhos explícitos já documentados no `CLAUDE.md` (arquivo + função + linha aproximada). Não editar com base em suposição ou em busca própria.
- Proibido usar busca exploratória (`grep`, scan de pastas, leitura de diretórios inteiros) — exceção única: o fluxo pedido não está documentado nem em `FLOW.md` nem no `CLAUDE.md`. Nesse caso, a busca é permitida apenas o suficiente para localizar o fluxo, e o achado deve ser documentado depois (atualizar `FLOW.md`/`CLAUDE.md`).
- Antes de qualquer alteração, responder sempre nesta ordem:
  1. **fluxo** (qual fluxo, conforme `FLOW.md`/seção 4)
  2. **arquivo** (caminho exato)
  3. **função** (nome exato, com linha aproximada se houver)
  Só depois disso a edição pode prosseguir.

## 10. FRAMEWORK LOCK MODE (INDUSTRIAL EXECUTION GUARANTEE) — SUSPENSO PARA O ESCOPO DA V2

> ⚠️ **SUPERADA PELA SEÇÃO 12 desde 2026-07-08.** Para o trabalho da V2 (refatoração, modularização, débito técnico, UX, funcionalidades novas em `mae/`, `test/`, `docs/`), esta seção **não se aplica**: exploração e reestruturação estão autorizadas, com a contrapartida de atualizar o `FLOW.md` no mesmo PR. Esta seção permanece em vigor para tudo que estiver **fora** do escopo da seção 12.2 — em especial, qualquer mudança de comportamento em produção.

> Esta seção substitui a exceção de busca exploratória prevista na seção 9. A partir daqui, não existe mais exceção: se o fluxo não está no `FLOW.md`, a tarefa não é executada, ponto final.

1. `FLOW.md` é a **única** fonte permitida para execução de tarefas. Nenhum agente deve derivar passos de execução de outro lugar.
2. Se uma tarefa não estiver documentada no `FLOW.md`:
   - não executar;
   - não explorar o repositório sob nenhuma justificativa;
   - solicitar explicitamente ao usuário onde/como adicionar o fluxo faltante ao `FLOW.md`, e parar aí.
3. `CLAUDE.md` serve apenas como regras estruturais (arquitetura, riscos, zona proibida) — **nunca** como fonte de execução. Execução vem exclusivamente do `FLOW.md`.
4. Proibido alterar comportamento com base em inferência, suposição ou busca de código. Toda ação deriva de um fluxo já escrito no `FLOW.md`.
5. Toda ação começa obrigatoriamente identificando, nesta ordem:
   - fluxo identificado no `FLOW.md`;
   - arquivo exato;
   - função exata.
6. Se houver qualquer dúvida sobre um fluxo (ambiguidade, fluxo incompleto, arquivo/função desatualizado):
   - parar a execução imediatamente;
   - não explorar diretórios para tentar resolver a dúvida sozinho;
   - solicitar ao usuário a atualização do `FLOW.md` antes de prosseguir.

## 11. MODO MANUTENÇÃO AUTOMÁTICA (ANTI-ENTROPIA) — postura padrão do agente

> ⚠️ **Emendada pela seção 12 desde 2026-07-08.** A postura "guardião de estabilidade, não refatorador" continua sendo o padrão **fora** do escopo da V2. Dentro do escopo da seção 12.2, refatorar é a tarefa — mas **todos os monitoramentos abaixo (performance, estado implícito, governança, git/deploy) e a saída obrigatória continuam valendo integralmente**.

> Instituído em 2026-07-05, após o audit de performance/governança (PR #4/#5/#6, tag `v1.0-stable`, deploy `@29`). Vale para qualquer sessão de agente neste repositório a partir de agora, mesmo sem o histórico da conversa em que foi definido — não é um pedido pontual, é a postura padrão.

**Papel do agente**: guardião de estabilidade contínua, não refatorador contínuo. Na ausência de um pedido explícito de refatoração/otimização/redesenho, o padrão é conservar o que já foi auditado, não melhorar por iniciativa própria.

**Monitorar sempre, antes de aprovar qualquer mudança nova em `mae/*.js`/`mae/*.html`:**
1. **Regressão de performance** — nenhuma função nova pode: reprocessar a planilha inteira sem necessidade, rodar validação/auditoria no hot path do Portal (`doGet`/`doPost`/`login`/`get*`), ou duplicar leitura de `SpreadsheetApp` que já foi lida na mesma execução.
2. **Estado implícito (crítico)** — proibido depender de execução anterior, cache não documentado explicitamente no código, ou contexto global mutável entre requisições. Todo cache introduzido (`CacheService`/`PropertiesService`) precisa ter TTL explícito e comentário explicando o que invalida.
3. **Governança** — antes de alterar qualquer coisa, checar se `CLAUDE.md`/`FLOW.md`/`SYSTEM_MAP.md`/`SYSTEM_TRUTH.md` ainda batem com o código real. Se houver divergência, **sinalizar ao usuário antes de alterar código ou doc** — não corrigir silenciosamente os dois lados na mesma tarefa sem dizer qual estava errado.
4. **Git/Deploy** — `main` é protegido de verdade no GitHub (PR obrigatório, sem push direto, sem force-push, `enforce_admins: true`). Nunca sugerir ou tentar contornar isso (`--no-verify`, push direto, desabilitar a proteção). Mudança de código sempre via branch + PR; `clasp push`/`clasp deploy` são ações de produção separadas, só com confirmação explícita do usuário (já era regra da seção 7, reforçada aqui).

**Regras de execução deste modo:**
- Não reestruturar arquitetura sem solicitação explícita.
- Não otimizar por conta própria se não houver problema real medido/relatado — otimização especulativa é a mesma entropia que este modo existe para evitar.
- Não alterar `MAP.BASE` sem aprovação explícita (migração de índice fixo para `getHeaderMap()` já foi feita em 2026-07-07 — ver seção 6 e `SYSTEM_TRUTH.md` seção 4; qualquer alteração adicional a `MAP.BASE`/cabeçalhos lidos de `BASE DE DADOS` continua exigindo aprovação explícita).
- Não mover validação crítica de negócio para o hot path, nem o inverso sem entender o motivo original de estar onde está.
- Não criar nova fonte de verdade — toda documentação nova referencia `SYSTEM_TRUTH.md`/`CLAUDE.md`/`FLOW.md`/`SYSTEM_MAP.md`, nunca duplica o que eles já cobrem (`SYSTEM_SCHEMA.md`, gerado pelo `SchemaExporter.js`, é a única exceção — é gerado, não escrito à mão).

**Saída obrigatória ao avaliar qualquer PR/diff/código novo neste repositório:**
```
Status de estabilidade: OK | RISCO | BLOQUEADO
Impacto em performance: nenhum | leve | médio | crítico
Impacto em governança: sim | não (+ qual arquivo diverge, se sim)
Risco de estado implícito: sim | não
Recomendação final: seguir | ajustar | não aplicar
```

## 12. MODO V2 — EVOLUÇÃO AUTORIZADA (vigente desde 2026-07-08)

> **Autorização explícita e permanente do usuário**, dada em 2026-07-08. Esta seção **substitui a seção 10** (FRAMEWORK LOCK MODE) e **emenda a seção 11** (MODO MANUTENÇÃO) para o escopo definido em 12.2. Fora desse escopo, as seções 10 e 11 continuam valendo na íntegra.
>
> **Por que existe**: as seções 10 e 11 foram escritas para a fase de estabilização da V1 e proibiam explicitamente refatorar, reorganizar arquitetura e explorar o repositório. A V2 é exatamente esse trabalho. Sem esta seção, um agente é obrigado a recusar a tarefa — e estaria certo.

### 12.1 A stack não muda

A V2 é desenvolvida **mantendo integralmente a infraestrutura atual**:

- **Frontend**: GitHub Pages
- **Backend**: Google Apps Script
- **Banco de dados**: Google Sheets
- **Arquivos**: Google Drive
- **Versionamento**: Git/GitHub

**Suspenso, não em discussão nesta fase** (reclassificado como pesquisa para uma futura **V3**): Supabase, PostgreSQL, ETL, migração de banco, Next.js, qualquer schema de nova infraestrutura. Material preservado em `docs/V2_ESPECIFICACAO_TECNICA.md` (marcado como suspenso) e no repo `estudioela/plataforma`, tag `v3-research-parked`. **Não implementar.**

### 12.2 O que passa a ser autorizado e incentivado

Dentro de `mae/`, `test/` e `docs/`:

- **Refatoração arquitetural** — separar responsabilidades, extrair módulos, isolar camadas.
- **Modularização** — quebrar arquivos monolíticos (`mae/Index.html`, `mae/WebApp.js`, `mae/Código.js`) em unidades coesas.
- **Redução de débito técnico** — eliminar acoplamento, duplicação e leituras redundantes de planilha.
- **Reorganização do código** — renomear, mover e reagrupar funções por domínio.
- **Melhorias de UX/UI** — no Portal e nas sidebars do ERP.
- **Funcionalidades novas** — dentro da stack (ex.: módulo de Contratos).
- **Exploração do repositório** — `grep`, leitura de diretórios e busca de código passam a ser **permitidos** em `mae/`, `test/` e `docs/`. A seção 10 fica suspensa neste escopo.

**Contrapartida obrigatória**: todo fluxo tocado é documentado ou atualizado no `FLOW.md` **no mesmo PR**. Exploração autorizada não é licença para deixar o mapa desatualizado.

### 12.3 Preparar a V3 sem executá-la

A V2 **prepara** a aplicação para uma futura migração de infraestrutura, mas **não a realiza**. Na prática, isso significa uma diretriz e apenas uma:

> **Isolar o acesso a dados.** Toda leitura/escrita de planilha deve migrar para trás de uma camada de repositório, de modo que trocar Google Sheets por um banco real, na V3, altere **somente essa camada**.

Não antecipar abstrações além disso. Não introduzir dependências, formatos ou padrões cuja única justificativa seja "a V3 vai precisar". A V3 será planejada quando a V2 estiver madura e estabilizada.

### 12.4 Limites inegociáveis (nenhum foi relaxado)

A autorização de evoluir **não** relaxa nenhuma proteção existente:

1. **Compatibilidade com produção é intocável.** Nenhuma refatoração pode alterar comportamento observável: contratos entre `mae/Index.html` e `mae/WebApp.js` (códigos de erro, formato de retorno), nomes de abas, nomes de cabeçalho, valores de validação de célula, URL pública do Web App. Refatorar é mudar a forma do código, nunca o que o sistema faz.
2. **Zona proibida (seção 7) permanece integralmente em vigor** — `mae/.clasp.json`, `mae/appsscript.json`, `MAP.*.NOME_ABA`, `SETUP.ABAS`, branch `pages-portal`, repos externos.
3. **`main` é protegido de verdade** (PR obrigatório, sem push direto, sem force-push, `enforce_admins`). Nunca sugerir ou tentar contornar.
4. **`clasp push` e `clasp deploy` são ações de produção** — só com **aprovação explícita do usuário**, uma a uma. `clasp push` substitui o conteúdo remoto por completo; arquivo novo em `mae/` só sobe se estiver na allowlist `mae/.claspignore`.
5. **`pages-portal` é produção ao vivo**, sem staging. Mudanças nela afetam `portal.estudioela.com` imediatamente.
6. **Nunca descartar dado sem informar o usuário antes.** Ao encontrar erro ou risco de perda de dados: parar, reportar, aguardar.
7. **A suíte de testes é a rede de segurança.** Nenhuma refatoração é aceita com teste vermelho, e **nenhuma refatoração altera as asserções de negócio existentes** — se um teste precisa mudar para a refatoração passar, o comportamento mudou, e isso é uma quebra de compatibilidade (item 1), não um ajuste de teste.
8. **Commit imediato após teste verde.** Trabalho testado e não-commitado já foi perdido neste repositório por um `clasp pull` externo.

### 12.5 Regime de entrega

Entregas **pequenas, independentes e reversíveis**. Cada uma: um fluxo, um PR, testes verdes, `FLOW.md` atualizado, comportamento idêntico ao anterior.

Proibido o *big bang*: nenhuma refatoração pode tocar vários fluxos de uma vez. Se uma etapa não puder ser validada isoladamente antes da seguinte, ela está grande demais e deve ser quebrada.

Plano incremental vigente: **`docs/V2_ROADMAP.md`**. Ponto de entrada de qualquer sessão nova: **`NEXT_AGENT.md`**.

### 12.6 A saída obrigatória da seção 11 continua valendo

Toda avaliação de PR/diff/código novo continua emitindo o bloco de estabilidade definido no fim da seção 11.
