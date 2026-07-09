# NEXT_AGENT.md — contexto mínimo para continuar

> Fonte única de continuidade. Atualizado em 2026-07-08, após o realinhamento de direção da V2.

## Resumo do sistema (≤15 linhas)
ERP + Portal de Influenciadoras do Estúdio Elã. **Um único projeto Google Apps Script** (`mae/`), versionado neste repo e deployado via `clasp`. `mae/Código.js` é o ERP (roda dentro da Planilha Google, menu customizado). `mae/WebApp.js` é o backend do Portal (Web App público, `doGet`). `mae/Index.html` é o front-end do Portal (SPA de arquivo único, sem framework). A **Planilha Google é o único banco de dados**. Arquivos ficam no Google Drive. `portal.estudioela.com` é servido por GitHub Pages **deste repo**, branch `pages-portal` (não `main`) — é produção, sem staging. Versão em produção: deploy `@37` (ERP 1.8), estabilizada. Suíte Jest (~156–163 testes) executa o código GAS real via `vm` e é a **especificação executável** das regras de negócio.

## Arquitetura (poucas linhas)
GitHub Pages (front) · Google Apps Script (backend) · Google Sheets (banco) · Google Drive (arquivos) · Git/GitHub (versionamento). **Essa stack permanece na V2.**

## Estado atual
V1 **estabilizada e em produção** (`@37`). A **V2 foi redefinida em 2026-07-08**: *não* é migração de infraestrutura — é evolução da aplicação **dentro da stack atual**. A autorização já está **formalizada no `CLAUDE.md` §12 (MODO V2 — EVOLUÇÃO AUTORIZADA)**, que suspende o *lock* das §10/§11 dentro de `mae/`, `test/` e `docs/`. **Nenhum código da V2 foi escrito ainda.**

## Tarefas pendentes (em ordem)
1. **Etapa 0.1** — rodar `npm test` e mapear quais fluxos **não** têm cobertura.
2. **Etapa 0.2** — *characterization tests* para os fluxos descobertos sem cobertura. **Nada é refatorado antes disso.**
3. **Bloco 1 — `mae/Repo.js`**: isolar `SpreadsheetApp`. Começa por **1.1 (fluxo Perfil)**; depois 1.2–1.8, independentes entre si.
4. **Bloco 2** — modularizar `mae/Index.html` via includes do HtmlService (2.1 CSS → 2.2 JS → 2.3 telas).
5. **Bloco 3** — separar responsabilidades (`Auth.js`, regras puras, `WebApp.js` só roteia).
6. **Bloco 4** — staging (planilha + deployment de teste). **Requer ação manual do usuário.** Trilha paralela.
7. **Bloco 5/6** — UX/UI e módulo de Contratos.

**Aberto**: o escopo funcional da V2 além de Contratos **ainda não foi definido pelo usuário**.

Detalhamento completo, critérios de aceite e dependências: **`docs/V2_ROADMAP.md`**.

## Decisões arquiteturais já tomadas
- **A V2 mantém a stack atual.** Supabase, ETL, Postgres, Next.js e migração de banco estão **suspensos** e reclassificados como pesquisa para uma futura **V3** (só depois que a V2 amadurecer).
- Toda coluna de planilha é resolvida **por nome de cabeçalho** (`getHeaderMap()`), nunca por índice fixo. Migração concluída em 2026-07-07/08.
- IDs de ativação são **UUIDs estáveis** na coluna `ID` de `ATIVAÇÕES` (migração 2026-07-08); upload resolve a linha por ID, não por número de linha.
- Arquivamento (`arquivarGenerico()`) copia **por nome de cabeçalho**, não por posição.
- `BRIEFING` casa por `MES` + `ANO_REFERENCIA`.
- Preparação para a V3 se faz **isolando o acesso a dados** (P1), não migrando agora.

## Armadilhas conhecidas
- **Refatorar é autorizado, quebrar não é.** `CLAUDE.md` §12.4: comportamento observável não muda (códigos de erro, formato de retorno, nomes de aba/cabeçalho, valores de validação de célula, URL pública). **Se um teste precisa mudar para a refatoração passar, o comportamento mudou** — isso é quebra de compatibilidade, não ajuste de teste.
- **Não refatore o que não está coberto por teste.** Etapa 0.2 existe por isso.
- **`clasp push` substitui o remoto por completo.** Arquivo novo em `mae/` só sobe se estiver na allowlist `mae/.claspignore`.
- **`clasp run` não funciona** (a conta é editora, não dona do script). Funções de menu exigem execução manual pelo usuário. Não reinvestigar sem motivo novo.
- **Trabalho não-commitado já foi perdido** por um `clasp pull` externo. **Commitar imediatamente após testes verdes.**
- **`main` é protegido** (PR obrigatório, sem force-push). Nunca contornar.
- **`pages-portal` e `clasp deploy` atingem produção na hora** — sem staging.
- **Erros de validação de célula escapam de `try/catch`** (flush diferido). Foi a causa raiz do "Failed to fetch" no upload.
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
- `mae/.claspignore` — allowlist de deploy. Arquivo novo não listado **não sobe**.
- `mae/appsscript.json`, `mae/.clasp.json` — **zona proibida** (§7 do `CLAUDE.md`).
- `test/` — a especificação executável.

## Primeiro passo recomendado
**Etapa 0.1**: rodar `npm test`, confirmar a suíte verde e mapear quais fluxos do §4 do `CLAUDE.md` **não** têm cobertura. Entregar esse relatório de lacunas antes de escrever qualquer *characterization test* (0.2) — e nenhuma refatoração antes de 0.2 estar pronta.
