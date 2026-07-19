# Projeto Tear V2 — Portal da Parceira

Sistema de gestão de colaborações com influenciadoras (Estúdio Elã), em
Google Apps Script + Google Sheets, versionado neste repositório e
sincronizado via `clasp`.

## Arquitetura

O código de produção vive em **`src/`**, organizado em **fatias verticais**
(ADR-014): um arquivo por módulo de negócio em `src/modulos/`, com as camadas
DDD como seções internas, sempre nesta ordem de responsabilidade:

```
Entrypoint (Portal.js) → Controller → Service → Repository → ACL → Domain
```

Os contratos de cada camada estão em `docs/ARQUITETURA_CAMADAS.md`.

- Só a **ACL** conhece a coluna física da planilha (resolução sempre por
  cabeçalho, nunca por índice fixo).
- Só o **Controller** converte exceção em envelope `{ success, data | error }`
  (`src/shared/Nucleo.js`).
- O **Domain** é puro — não conhece `SpreadsheetApp`, HTML ou HTTP.
- O **Entrypoint** (`src/entrypoint/Portal.js`) é o único ponto autorizado a
  tocar `SpreadsheetApp`/`LockService` e a compor o grafo de objetos.

> **Nota (2026-07-19):** a consolidação ADR-014 (`src/` por camada →
> `src/modulos/` por módulo de negócio) foi publicada no Apps Script oficial
> nesta data (versão 32, deployment de produção `AKfycbwUhR1P7…`) — ver
> `docs/_workspace/TASK_ROUTER.md` §13.

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
- **Sincronização com Apps Script:** `clasp push` (allowlist em
  `.claspignore`).
- **Deploy de produção:** ação controlada pelo operador — `clasp deploy -i
  <deployment>`. Nenhum deploy automático.
