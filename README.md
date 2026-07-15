# Projeto Tear — tear (V2)

tear + Portal de Influenciadoras, em um único projeto Google Apps Script,
versionado neste repositório e sincronizado via `clasp`.

## Arquitetura (V2 consolidada)

O código de produção vive em **`tear/`** — 10 arquivos no escopo global do Apps
Script, organizados por camada:

```
Roteador → Controllers → Services → Repositories → Infra / Modelos
```

- Só o **Repository** acessa `SpreadsheetApp`.
- Só o **Controller** (via envelope) converte exceção em `{ success, data | error }`.
- O **front-end** (`Index/Styles/Templates.html`) nunca toca a planilha; fala com o
  Roteador via `google.script.run`.

Detalhe arquitetural completo em **`docs/SYSTEM_MAP.md`**.

A base legada **V1 permanece em `mae/`** apenas como referência; será migrada para a
V2 na próxima fase (scripts de migração de dados).

## Documentação oficial (fonte da verdade)

| Documento | Responsabilidade |
|-----------|------------------|
| `CLAUDE.md` | Contrato operacional para agentes de IA |
| `docs/PROJECT_PHILOSOPHY.md` | Princípios permanentes |
| `docs/SYSTEM_MAP.md` | Arquitetura |
| `docs/KNOWN_DECISIONS.md` | Decisões permanentes |
| `docs/PROJECT_STATUS.md` | Estado atual |
| `docs/CHANGELOG_DE_DESENVOLVIMENTO.md` | Histórico de desenvolvimento |
| `docs/spec/SCHEMA_V2.md` | Schema das abas da planilha |

## Estado

**Fase 1 (Estrutura e UI V2) concluída — pronto para a Migração de Dados.**
Próxima fase: scripts de migração da V1 para a V2. Ver `docs/PROJECT_STATUS.md`.

## Desenvolvimento

- **Testes:** `npx jest` (suíte em `test/`).
- **Sincronização com Apps Script:** `clasp push` (allowlist em `tear/.claspignore`).
- **Deploy de produção:** ação controlada pelo operador — `clasp deploy -i <deployment>`.
  Nenhum deploy automático.
