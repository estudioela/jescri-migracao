# SYSTEM_SPEC v1 — Jescri (ERP + Portal de Influenciadoras)

> Snapshot oficial pós-auditoria de 2026-07-05. Cada afirmação aqui foi verificada nesta sessão (diff real entre `mae/` e o projeto Apps Script ao vivo, `clasp status`/`clasp deployments`, leitura de código) — não é resumo de suposição. Para detalhe função-a-função, ver `CLAUDE.md` (mapa técnico), `FLOW.md` (fluxos executáveis) e `SYSTEM_MAP.md` (mapa por aba da planilha).

## 1. Visão geral

Projeto único: ERP + Portal de Influenciadoras, um só projeto Google Apps Script (`scriptId: 1fE8w10O3MwHvfa4gLgJvcUXD4HIWKNL0ar5YMmjzMamujRfwqiPfcLyK`), versionado neste repo em `mae/`, deployado via `clasp`. Planilha Google (`[JESCRI] INFLUÊNCIA 360º`, aba `BASE DE DADOS`) é o único banco de dados.

## 2. Arquitetura

**Backend (Apps Script):**
- `mae/Código.js` — ERP: menu, `onEdit`/`onFormSubmit`, ciclo mensal, arquivamento.
- `mae/WebApp.js` — Portal: `doGet`/`doPost`, todas as funções chamadas via `google.script.run`.
- `mae/PortalUi.gs` — abre `Index.html` em modal dentro da planilha.
- `mae/SidebarBackend.js` — backend das sidebars do ERP.
- `mae/SchemaExporter.js` — gera schema vivo da planilha + checklist de integridade (ver seção 4).
- `mae/appsscript.json` — manifest (timezone, oauthScopes, config do Web App).

**Frontend:** `mae/Index.html` (SPA único do Portal), `mae/Sidebar.html`/`mae/SidebarPagamento.html` (sidebars do ERP). Sem duplicação confirmada — não existem `PortalApp.html`/`views_*.html`/versões paralelas.

**Dados:** `BASE DE DADOS` é fonte única (sem planilha de apoio externa — descontinuada, ver `CLAUDE.md` seção 6).

## 3. Deploy / clasp — estado real (verificado)

- Único `.clasp.json` funcional, exclusivamente em `mae/`. Projeto clasp duplicado que existia na raiz (mesmo `scriptId`) foi **removido** nesta sessão.
- `mae/.claspignore` é uma **allowlist explícita** (9 arquivos legítimos) — arquivo novo em `mae/` só é enviado se for adicionado a essa lista.
- **Auditoria remota**: pull isolado do projeto ao vivo (fora do repo, sem sobrescrever `mae/`) comparado byte-a-byte contra `mae/` — **idêntico nos 9 arquivos**. `mae/` é espelho 1:1 do HEAD do script.
- **Ressalva importante, não mitigada**: o Web App público (`portal.estudioela.com`) usa a deployment fixa `AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA` (@24), que **não se atualiza sozinha com `clasp push`** — só reflete o HEAD depois de um `clasp deploy -i <essa-deployment-id>` explícito. Nenhuma mudança em `WebApp.js`/`Index.html` foi feita nesta sessão, então não há regressão funcional agora, mas qualquer mudança futura ali exige esse passo extra, que é uma ação de produção e requer confirmação explícita antes de rodar (zona proibida, `CLAUDE.md` seção 7).

## 4. Integridade do sistema

`mae/SchemaExporter.js` — módulo novo desta sessão:
- Gera `SYSTEM_SCHEMA.json`/`SYSTEM_SCHEMA.md` (estrutura real da planilha: abas, colunas, amostra, valores únicos de colunas de status), versionado por hash SHA-256 do conteúdo estrutural.
- Idempotente: lock (`LockService`) + debounce (20s no `onEdit`) + skip se hash inalterado.
- Gatilhos: menu manual, `onEdit` instalável, trigger de tempo (15min), fim de `gerarNovoMesCompleto()`.
- **`verificarIntegridadeSistema()`**: valida, contra a planilha viva, o risco já documentado no `CLAUDE.md` — `MAP.BASE` (`mae/WebApp.js`) usa índice fixo de coluna, não `getHeaderMap()`. Compara o cabeçalho real de `BASE DE DADOS` posição a posição contra o que `MAP.BASE` espera; também confirma que todas as abas de `SETUP.ABAS` existem. Resultado embutido em toda exportação de schema.
- **Pendente**: instalação dos triggers instaláveis (`instalarTriggersSchemaExporter()`, menu " 📄 Schema Vivo") ainda não confirmada rodando na planilha real — passo manual único, combinado como próxima etapa.

## 5. Estado de versionamento (nesta sessão)

- Branch: `feat/schema-exporter-clasp-cleanup`
- Commit: `24d0ac0`
- PR: [#2](https://github.com/estudioela/jescri-migracao/pull/2) — aberto, não mergeado
- `CLAUDE.md`, `FLOW.md`, `SYSTEM_MAP.md` atualizados e incluídos no PR

## 6. Pendências conhecidas

1. Rodar "Instalar Triggers Automáticos" na planilha real e validar os 3 gatilhos.
2. Merge do PR #2 (decisão do usuário, não executado automaticamente).
3. `clasp deploy` da deployment `@24` — só necessário quando houver mudança real em `WebApp.js`/`Index.html`; decisão de produção, não automática.
4. Um sub-fluxo documentado em `FLOW.md` (derivação `STATUS_CONTEUDO`→`STATUS_PAGAMENTO`) foi identificado como não correspondente ao código real durante a auditoria — correção proposta ao usuário, ainda não aplicada no `FLOW.md`.
