# CLAUDE.md — Mapa técnico do repositório

> Otimizado para agentes de IA. Não é documentação para humanos. Toda referência aponta pra arquivo/função real — linhas conferidas em 2026-07-05, podem ter driftado; se driftarem, `grep -n "^function NOME"` no arquivo indicado resolve.

## 1. Visão geral (10 linhas)

Projeto único: ERP + Portal de Influenciadoras Jescri, um só projeto Google Apps Script (`mae/`), versionado neste repo Git, deployado via `clasp`. `mae/Código.js` é o ERP (roda dentro da Planilha Google, menu customizado). `mae/WebApp.js` é o backend do Portal (Web App público, `doGet`/`doPost`). `mae/Index.html` é o front-end do Portal (SPA de um arquivo só, sem framework). Planilha Google = único banco de dados; Portal só lê/escreve nela via Apps Script, não existe banco separado. `docs/` é documentação (inclusive referência visual do Stitch, em `docs/design-reference/`); `sites/` está vazio (placeholder oficial pra sites auxiliares, ver `PROJECT_GOVERNANCE.md`) — nenhum dos dois faz parte do app, não abrir por padrão. `portal.estudioela.com` é servido por GitHub Pages **deste mesmo repositório**, branch `pages-portal` (não a `main`).

## 2. Mapa de arquitetura real

**Backend (Apps Script, roda no Google):**
- `mae/Código.js` — ERP: menu (`onOpen`), automações da planilha (`onEdit`, `onFormSubmit`), ciclo mensal, arquivamento, sincronização de looks.
- `mae/WebApp.js` — Portal: `doGet`/`doPost`, todas as funções chamadas via `google.script.run` pelo front-end, `MAP` (mapeamento de colunas).
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

- **Briefing (resumo do mês)**
  arquivo: `mae/WebApp.js`, função `getBriefing()` (~L289)
  não mexer: fallback de coluna (`hBrief['RESUMO'] || ... || MAP.BRIEFING.RESUMO`) sem saber o cabeçalho real da aba BRIEFING.
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

- **Arquivo sensível — `mae/WebApp.js` `MAP.BASE`**: índices de coluna **fixos por número** (não por `getHeaderMap`), únicos assim no arquivo (todo o resto usa nome de cabeçalho). Se alguém inserir/remover coluna em `BASE DE DADOS`, quebra login/perfil **silenciosamente** (lê célula errada, não dá erro).
- **Padrão inconsistente**: `BASE`/`BRIEFING` em `MAP` (WebApp.js) usam índice fixo; `ATIVACOES`/`PAGAMENTOS`/`HISTORICO_*` usam `getHeaderMap()`. Não é bug, mas é a maior fonte provável de confusão futura — confirme qual padrão uma função usa antes de copiar código de outra.
- **`onFormSubmit()`** (`mae/Código.js` ~L544): depende de trigger instalável configurado fora do código-fonte (painel de Triggers do Apps Script). Não há como confirmar por aqui se está de fato instalado.
- **Legado já removido** (não recriar): `Portal.js`, `Sincronizador.js`, `SincronizarPortal.js` — sincronizavam com uma "Planilha de Apoio" externa (ID `1289Eu3hk-...`) que foi descontinuada. `BASE DE DADOS` é fonte única desde então. Removidos do repo git há tempos, mas **continuavam vivos no projeto Apps Script em produção** (só sumiram de fato do script ao vivo em 2026-07-05, como efeito colateral de um `clasp push` a partir de `mae/`, que substitui o conteúdo remoto por completo). Se esses nomes de arquivo aparecerem em algum backup/branch antigo, não restaurar sem entender que o fluxo que eles implementavam não existe mais.
- **Incidente 2026-07-05 — projeto clasp duplicado na raiz**: chegou a existir um `.clasp.json` na raiz do repo (fora de `mae/`) apontando pro **mesmo `scriptId`** de produção, não versionado, com um `.claspignore` que ignorava `*.html` — um push a partir dali teria apagado todo HTML do Portal em produção. Havia também um `mae/PortalUi.js` (duplicata de `mae/PortalUi.gs`, mesma função `abrirPortalModal()`), que colidiria como o mesmo arquivo remoto no clasp. Ambos eram não-versionados (removidos sem perda de histórico). Por isso `mae/.claspignore` agora existe como allowlist explícita (só os arquivos legítimos, listados na íntegra em `mae/.claspignore`) — qualquer arquivo novo dentro de `mae/` só é enviado no push se for adicionado a essa lista.
- **`doGet(?mode=qa)`** (`mae/WebApp.js`): novo ramo condicional que só ativa com token correto (`mae/QaShadow.js:configurarTokenQA()`, guardado em `PropertiesService`, nunca no código). Sem token certo, cai no comportamento padrão — mas é, ainda assim, um novo ramo de código dentro do `doGet` público e anônimo (`ANYONE_ANONYMOUS`). Se mexer em `doGet`, confirmar que esse fallback continua incondicional pra qualquer requisição sem `mode=qa` ou com token errado.
- **`clasp run` não funciona neste projeto (2026-07-05, investigado a fundo, não tentar de novo sem motivo novo)**: mesmo com projeto GCP standard vinculado (`jescri-migracao`), Apps Script API habilitada nele, `executionApi.access: ANYONE` no manifest e implantação atualizada (`@27`), `clasp run` falha. Causa raiz confirmada por documentação oficial (`developers.google.com/apps-script/api/how-tos/execute`): `clasp run` usa `devMode: true` por padrão, e "only the owner of the script can execute it in development mode" — a conta autenticada (`elafashionmkt@gmail.com`) é editora, não dona (`clasp list-scripts` retorna vazio). `clasp run --nondev` contorna essa regra mas retorna 404 "Requested entity was not found" — sem causa documentada oficialmente pelo Google (só relatos de terceiros sugerindo usar o ID da implantação em vez do `scriptId` na chamada, não testável via `clasp` sem montar requisição HTTP manual, que foi deliberadamente evitado). Automação de funções de menu (`configurarTokenQA`, `instalarTriggersSchemaExporter`, `rodarQaShadowAgora` e as versões `*Headless`) continua exigindo execução manual pela UI do Apps Script/planilha.
- **Pastas de backup que existiam na raiz** (`_archive_legacy_stitch/`, `_backup_cleanup_20260704_214648/` ~72M, `_backup_stitch_consolidacao_20260704/`): já estavam no `.gitignore` (nunca foram versionadas) — removidas da raiz em 2026-07-05, movidas para `~/Backups/jescri-migracao-root-cleanup-.../` (fora do repo, na máquina local). Histórico morto, não recriar.
- **`stitch_import/` (referência visual do Stitch)**: movido de `stitch_import/` (raiz) para `docs/design-reference/stitch-import/` em 2026-07-05, via `git mv` (histórico preservado). Atualizar este caminho se referenciar em outro lugar.
- **`sites/`**: hoje vazio (mirrors locais de `estudioela.com`/`portal-influenciadoras` foram removidos por serem espelhos sem uso). Não recriar sem necessidade real.

## 7. Zona proibida (não alterar sem confirmação explícita do usuário)

- `mae/.clasp.json` (`scriptId`) — aponta pro projeto Apps Script real em produção.
- `mae/appsscript.json` (`oauthScopes`, `webapp.executeAs`, `webapp.access`) — reconfigura permissões do deploy ao vivo.
- `MAP.BASE` em `mae/WebApp.js` — só alterar com a estrutura real da aba `BASE DE DADOS` confirmada (não é verificável por código, só olhando a planilha).
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

## 10. FRAMEWORK LOCK MODE (INDUSTRIAL EXECUTION GUARANTEE)

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
