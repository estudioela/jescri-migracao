# Projeto Tear V2 — Portal da Parceira

Sistema de gestão de colaborações com influenciadoras (Estúdio Elã), em
Google Apps Script + Google Sheets, versionado neste repositório e
sincronizado via `clasp`.

## Arquitetura

O código de produção vive em **`src/`**, em camadas DDD:

```
Entrypoint (Portal.js) → Controller → Service → Repository → ACL → Domain
```

- Só a **ACL** conhece a coluna física da planilha (resolução sempre por
  cabeçalho, nunca por índice fixo).
- Só o **Controller** converte exceção em envelope `{ success, data | error }`
  (`src/shared/Envelope.js`).
- O **Domain** é puro — não conhece `SpreadsheetApp`, HTML ou HTTP.
- O **Entrypoint** (`src/entrypoint/Portal.js`) é o único ponto autorizado a
  tocar `SpreadsheetApp`/`LockService` e a compor o grafo de objetos.

Cada funcionalidade (SPEC) tem sua especificação em `docs/specs/SPEC-NNN.md`;
decisões arquiteturais em `docs/adrs/`.

## Documentação oficial (fonte da verdade)

| Documento | Responsabilidade |
|-----------|------------------|
| `CLAUDE.md` | Contrato operacional para agentes de IA |
| `docs/_workspace/TASK_ROUTER.md` | Estado atual de cada SPEC e suas dependências |
| `docs/PRD.md` | Requisitos de produto |
| `CONTRATO_SOBERANO.md` | Domínio soberano (termos, VOs, agregados) |
| `docs/adrs/` | Decisões arquiteturais |
| `PROJECT_GOVERNANCE.md` | Governança de processo |
| `docs/_workspace/DEPLOY_CHECKLIST.md` | Checklist de pré-deploy e rollback (`clasp`) |
| `docs/_workspace/ROTEIRO_HOMOLOGACAO.md` | Roteiro manual de homologação do Portal |

> **Nota (2026-07-16):** este README descrevia uma arquitetura anterior
> (`tear/`, Roteador único) e uma lista de documentos (`docs/SYSTEM_MAP.md`,
> `docs/PROJECT_STATUS.md` etc.) que nunca chegaram a existir neste
> repositório — resíduo de uma tentativa de V2 anterior à atual. Corrigido
> na FASE 1 de integração pós-SPECs; ver `docs/_workspace/TASK_ROUTER.md`
> §6 para o achado completo.

## Estado

Ver `docs/_workspace/TASK_ROUTER.md` §3 para o status `[x]`/`[>]`/`[ ]` de
cada SPEC.

## Desenvolvimento

- **Testes:** `npm test` (suíte em `test/`, roda o código GAS real via `vm`).
- **Lint:** `npm run lint`.
- **Verificação completa:** `npm run check` (lint + suíte completa).
- **Preview local da UI (sem OAuth):** `npm run preview` → abre
  `http://localhost:8787/` (porta configurável via `PORT=`). Serve as telas
  reais de `src/ui/*.html` lidas do repositório a cada request (edição →
  refresh), com um simulador de `google.script.run`/`google.script.url` e
  dados de exemplo injetados só na resposta HTTP
  (`scripts/preview-server.mjs`) — nada de `src/`, do fluxo OAuth ou de
  produção é alterado, e a pasta `scripts/` nunca sobe ao Apps Script
  (allowlist do `.claspignore`). Na tela de login, "Entrar com Google"
  simula o retorno do OAuth e cai no Painel da Equipe; todas as telas
  também abrem direto por `/?pagina=<rota>` (mesmas rotas do `doGet`).
  Cada tela exibe o selo "PREVIEW — dados simulados".
- **Sincronização com Apps Script:** `clasp push` (allowlist em
  `.claspignore`).
- **Deploy de produção:** ação controlada pelo operador — `clasp deploy -i
  <deployment>`. Nenhum deploy automático.
