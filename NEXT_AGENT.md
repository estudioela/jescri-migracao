# NEXT_AGENT.md — contexto mínimo para continuar

> Fonte única de continuidade. Atualizado em 2026-07-09, após o avanço da interface do Projeto Tear (Etapas 1 e 3 concluídas, Etapa 4 em andamento).

## Resumo do sistema (≤15 linhas)
ERP + Portal de Influenciadoras do Estúdio Elã. **Um único projeto Google Apps Script** (`mae/`), versionado neste repo e deployado via `clasp`. `mae/Código.js` é o ERP (roda dentro da Planilha Google, menu customizado). `mae/WebApp.js` é o backend do Portal (Web App público, `doGet`). `mae/Index.html` é o front-end do Portal (SPA de arquivo único, sem framework). A **Planilha Google é o único banco de dados**. Arquivos ficam no Google Drive. `portal.estudioela.com` é servido por GitHub Pages **deste repo**, branch `pages-portal` (não `main`) — é produção, sem staging. Versão em produção: deploy `@42` ("ERP 2.1 — Episódio 0"), conforme `SYSTEM_TRUTH.md` §6. Suíte Jest executa o código GAS real via `vm` e é a **especificação executável** das regras de negócio — a contagem de testes não é fixada aqui de propósito (este arquivo já errou esse número por dias); rodar `npm test` para o valor atual.

## Arquitetura (poucas linhas)
GitHub Pages (front) · Google Apps Script (backend) · Google Sheets (banco) · Google Drive (arquivos) · Git/GitHub (versionamento). **Essa stack permanece na V2.**

## Estado atual
V1 **estabilizada e em produção** (`@42`, ver `SYSTEM_TRUTH.md` §6). A **V2 foi redefinida em 2026-07-08**: *não* é migração de infraestrutura — é evolução da aplicação **dentro da stack atual**. A autorização já está **formalizada no `CLAUDE.md` §12 (MODO V2 — EVOLUÇÃO AUTORIZADA)**, que suspende o *lock* das §10/§11 dentro de `mae/`, `test/` e `docs/`.

**A V2 (`tear/`) já tem código real**, em projeto Apps Script separado (`CLAUDE.md` §13): camada de domínio completa (`Ativacao`, `AtivacaoService`, `AtivacaoRepository`, `EventDispatcher`, `WebAppController`), camada de apresentação navegável (`Roteador.js`/`doGet`, `Index.html`, componentes, telas), superfície de leitura (`AtivacaoService.listarPorCiclo()`/`obter()`, `WebAppController.handleAtivacaoQuery()`) e pontos de entrada `google.script.run` (`tear/Api.js`). O front-end (`tear/app.html`) ainda usa `DADOS_MOCK` como fallback — a Etapa 4 (ligar a UI a essa leitura) está em andamento. Nunca houve `clasp push` de `tear/`; as abas V2 não existem na planilha viva. Detalhe: `FLOW.md`, seções "Projeto Tear" e "Casca navegável da V2".

## Tarefas pendentes (em ordem)

Roadmap da interface do Projeto Tear (`tear/`, `CLAUDE.md` §13). Etapas 1 (casca navegável) e 3 (superfície de leitura) **concluídas**.

1. **Etapa 4 (em andamento)** — ligar as telas de `tear/app.html` ao `WebAppController` via `google.script.run` (`tear/Api.js`), substituindo o fallback `DADOS_MOCK` pela leitura real (`handleAtivacaoQuery`, `LIST_BY_CYCLE`/`GET_BY_ID`).
2. Telas restantes sem Repository próprio — pagamentos, histórico, perfil (hoje só existe `AtivacaoRepository`/aba `Ativacoes`).
3. Escrita: ligar a UI a `handleAtivacaoUpdate()` (mudança de estado de ativação); envio de material (upload) ainda não implementado.
4. Autenticação da V2 — hoje **não existe** (`login()` vive só em `mae/WebApp.js`); pré-requisito para abrir o Web App além do `access: MYSELF` atual.

**Antes do cut-over**: as abas V2 **não existem** na planilha viva — criá-las é ação manual (`setupV2Database()`, `tear/Setup_V2.js`), exige autorização explícita. O seed `tear/DataSeed.js` está **corrompido** — `ON`/`OFF` na chave primária e `pagamentos: []` — não confiar nele sem corrigir antes de usar.

**Aberto**: o escopo funcional da V2 além de Contratos **ainda não foi definido pelo usuário**.

Detalhamento completo, critérios de aceite e dependências do roadmap mais amplo (fora só da interface): **`docs/V2_ROADMAP.md`**.

## Decisões arquiteturais já tomadas
- **A V2 mantém a stack atual.** Supabase, ETL, Postgres, Next.js e migração de banco estão **suspensos** e reclassificados como pesquisa para uma futura **V3** (só depois que a V2 amadurecer).
- Toda coluna de planilha é resolvida **por nome de cabeçalho** (`getHeaderMap()`), nunca por índice fixo. Migração concluída em 2026-07-07/08.
- IDs de ativação são **UUIDs estáveis** na coluna `ID` de `ATIVAÇÕES` (migração 2026-07-08); upload resolve a linha por ID, não por número de linha.
- Arquivamento (`arquivarGenerico()`) copia **por nome de cabeçalho**, não por posição.
- `BRIEFING` casa por `MES` + `ANO_REFERENCIA`.
- Preparação para a V3 se faz **isolando o acesso a dados** (P1), não migrando agora.

## Armadilhas conhecidas
- **Refatorar é autorizado, quebrar não é.** `CLAUDE.md` §12.4: comportamento observável não muda (códigos de erro, formato de retorno, nomes de aba/cabeçalho, valores de validação de célula, URL pública). **Se um teste precisa mudar para a refatoração passar, o comportamento mudou** — isso é quebra de compatibilidade, não ajuste de teste.
- **Não refatore o que não está coberto por teste.** Escrever *characterization test* antes de tocar código sem cobertura.
- **`clasp push` substitui o remoto por completo.** Arquivo novo em `mae/` só sobe se estiver na allowlist `mae/.claspignore`.
- **`clasp run` não funciona** (a conta é editora, não dona do script). Funções de menu exigem execução manual pelo usuário. Não reinvestigar sem motivo novo.
- **Trabalho não-commitado já foi perdido** por um `clasp pull` externo. **Commitar imediatamente após testes verdes.**
- **`main` é protegido** (PR obrigatório, sem force-push). Nunca contornar.
- **`pages-portal` e `clasp deploy` atingem produção na hora** — sem staging.
- **Erros de validação de célula escapam de `try/catch`** (flush diferido). Foi a causa raiz do "Failed to fetch" no upload.
- **No `vm` dos testes, `const`/`class` de topo de arquivo não viram propriedades do sandbox** — só `var`/`function` viram. Por isso `test/helpers/loadGasModule.js` precisa de `exportarNomes` para expor `const`/`class` explicitamente. `mae/` não sofre com isso porque usa só `var`/`function`; qualquer módulo novo (inclusive em `tear/`) que use `const`/`class` de topo precisa passar por `exportarNomes` para ser testável.
- **`tear/` usa os tokens canônicos `--ela-*` do design system, nunca os aliases de ponte do tema** (`--bg`, `--primary`, `--text`, etc.) — esses aliases existem só para a V1 não-migrada continuar funcionando, não são o vocabulário correto para código novo.
- **Regras permanentes do usuário**: nunca descartar dado sem informar antes; parar e reportar ao achar risco de perda de dados; `clasp push`/`deploy` só com aprovação explícita.

## Comandos úteis
```bash
npm test                 # suíte Jest — especificação executável das regras
cd mae && clasp push     # SÓ com aprovação explícita do usuário
cd mae && clasp pull     # cuidado: sobrescreve o working dir
```

## Documentação — ordem de leitura
1. **Este arquivo.**
2. `docs/V2_ROADMAP.md` — plano incremental da V2 (blocos, aceite, dependências).
3. `CLAUDE.md` **§12** — autorização e limites da V2. Depois o resto do arquivo (zona proibida §7, mapa de risco §6).
4. `FLOW.md` — mapa de fluxos; atualizar **no mesmo PR** de todo fluxo tocado.
5. `SYSTEM_TRUTH.md` / `SYSTEM_MAP.md` — verdade do sistema. `SYSTEM_SCHEMA.md` é **gerado**, não editar.
6. `docs/V2_ESPECIFICACAO_TECNICA.md` — **suspenso**, pesquisa de V3. Não implementar.

## Arquivos críticos
- `mae/WebApp.js` — backend do Portal (`doGet`, `login`, `get*`, upload). **Ler inteiro antes de qualquer grep parcial.**
- `mae/Código.js` — ERP: menu, `onEdit`, `onFormSubmit`, ciclo mensal, arquivamento.
- `mae/Index.html` — todo o front-end do Portal em um arquivo.
- `mae/.claspignore` — allowlist de deploy da V1. Arquivo novo não listado **não sobe**.
- `mae/appsscript.json`, `mae/.clasp.json` — **zona proibida** (§7 do `CLAUDE.md`).
- `tear/` — projeto Apps Script separado da V2 (`CLAUDE.md` §13): `Roteador.js` (`doGet`), `Api.js` (pontos de entrada `google.script.run`), `WebAppController.js`, `AtivacaoService.js`, `AtivacaoRepository.js`, `Ativacao.js`, `EventDispatcher.js`, `Config.js`; apresentação em `Index.html`/`app.html`/`views.html`/`components_ui.html`/`components_nav.html`/`styles_core.html`/`styles_theme.html`. `tear/.claspignore` e `.clasp.json` são próprios, não se sobrepõem aos de `mae/`.
- `test/` — a especificação executável (inclui `tear-shell.test.js`, `tear-dominio-leitura.test.js`, `tear-api.test.js`, `styles-sync.test.js`, `claspignore-allowlist.test.js` para a V2).

## Primeiro passo recomendado
Rodar `npm test` para confirmar a suíte verde e continuar a **Etapa 4** do Projeto Tear: ligar as telas de `tear/app.html` ao `WebAppController` via `tear/Api.js`, substituindo `DADOS_MOCK` pela leitura real já disponível (`handleAtivacaoQuery`). Ver `FLOW.md`, seção "Casca navegável da V2", "Pendências".
