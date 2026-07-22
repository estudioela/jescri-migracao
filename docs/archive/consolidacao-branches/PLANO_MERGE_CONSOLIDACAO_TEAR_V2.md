# Plano de Merge/Consolidação — TEAR V2

**Data:** 2026-07-20
**Papel do autor:** Tech Lead de execução (agente).
**Tipo:** Auditoria de integração + plano. **Nenhum merge, retarget de PR ou
alteração de código foi executado para produzir este documento** — só
`gh pr view/diff`, `git fetch/log/diff` (leitura).
**Gatilho:** P0-1 (gate de pagamento) entregue e aprovado
(`docs/IMPLEMENTACAO_P0_GATE_PAGAMENTO.md`); antes de seguir para P0-5,
consolidar a governança de branches/PRs represada (achado já registrado em
`docs/PLANO_PROXIMA_SPRINT_TEAR_V2.md`, seção "Governança de branches/PRs").

---

## 1. Estado real do merge — achado que corrige o plano anterior

O `docs/PLANO_PROXIMA_SPRINT_TEAR_V2.md` registrava "nenhuma PR existe ainda
para levar os commits de `tear-v2-app` para `main`". Isso **já não é
totalmente verdade**: a **PR #41** (`feat/ui-design-system-ela` → `main`)
foi mergeada em `main` hoje às 10:13 (antes desta sessão), trazendo 290
arquivos / +66028 linhas — toda a fundação do `tear-v2-app` (Sprint 1 +
Sprint 2.1) até o commit `326e2b7`.

**O que ainda falta ir para `main`:** 7 commits que entraram em
`feat/ui-design-system-ela` **depois** desse merge, incluindo o P0-1 desta
sessão:

```
326e2b7 (= main, merge-base)
  → a81eb19  fix: complete influencer password setup flow
  → 84af6b5  docs: auditoria do modelo de dados — TEAR V2.5
  → 7d752f1  docs: plano técnico frontend da Sprint 2.1
  → bae268f  feat: complete influencer portal foundation flow
  → bdaa563  docs: add influencer portal first access and profile
  → ce0e426  docs: consolida estado do TEAR V2.5 e define ordem da sprint
  → bca3d64  fix: enforce payment approval gate                [P0-1, esta sessão]
```

Confirmado por diff (`git diff origin/main a81eb19`): `main` ainda não tem
`ResetPasswordRequest`/rota de reset de senha nem nada a partir daí. **Não
existe PR aberta cobrindo esses 7 commits** — é a lacuna real a fechar,
mais estreita do que o plano anterior descrevia.

---

## 2. PRs mapeadas

### Relacionadas ao TEAR V2 / `tear-v2-app` (ativas nesta trilha)

| PR | Título | Base → Head | Estado | Mergeable | Arquivos | Commits |
|---|---|---|---|---|---|---|
| **#41** | Feat/UI design system ela | `main` ← `feat/ui-design-system-ela` | **MERGED** (2026-07-20 10:13) | — | 290 | 43 (fundação `tear-v2-app` completa) |
| **#42** | docs: auditoria de regras de negócio legado vs TEAR V2 | `main` ← `worktree-auditoria-regras-legado` | OPEN (draft) | ✅ MERGEABLE / CLEAN | 2 (só novos) | 2 — `AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` + `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` |
| **#43** | docs: auditoria de UX do Portal da Influenciadora | `feat/ui-design-system-ela` ← `worktree-linear-tumbling-gem` | OPEN (draft) | ✅ MERGEABLE / CLEAN | 1 (só novo) | 2 (inclui merge de #40 na própria branch) — `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` |

Nenhuma PR aberta para: `worktree-auditoria-pre-saas` (existe só como branch
remota, achado já registrado no plano anterior — baixa prioridade, veredito
"não agora para SaaS").

### Outras PRs abertas no repositório (varredura completa, `gh pr list`)

| PR | Título | Base | Mergeable | Relevância para TEAR V2 |
|---|---|---|---|---|
| #27 | docs: create implementation roadmap v2 | `main` | ✅ MERGEABLE / CLEAN | Sistema A (GAS), Fase 5 de planejamento **anterior** à implementação real das SPECs (todas já `[x]` no `TASK_ROUTER.md` desde 2026-07-17/19). Documento de planejamento hoje superado pelo que já foi implementado — mergear agora adicionaria doc desatualizada a `main`. **Recomendação: fechar sem merge** (decisão do responsável do projeto — não é bloqueio técnico, é curadoria de documentação) ou mergear só se houver valor histórico reconhecido. Não bloqueia nenhum P0.
| #17 | fix: rota /jescri-cadastro + docs | `main` | ❌ CONFLICTING / DIRTY | Sistema A pré-ADR-014: altera `mae/` (diretório removido do repo, confirmado — 0 arquivos `mae/*` em `main` hoje) e docs raiz já substituídos por `TASK_ROUTER.md`. **Órfã/obsoleta.** Recomendação: fechar.
| #13 | Ajustes funcionais do Portal Jescri | `main` | ❌ CONFLICTING / DIRTY (draft) | Mesma situação — altera `mae/`. **Órfã/obsoleta.** Recomendação: fechar.
| #1 | docs: sistema de documentação/orquestração para agentes de IA | `main` | ❌ CONFLICTING / DIRTY (draft) | `AGENTS.md`/`ARCHITECTURE.md`/`FLOW.md`/`CLAUDE.md` de 2026-07-05, anterior à reestruturação total do projeto. **Órfã/obsoleta.** Recomendação: fechar.

**Nota:** fechar #1/#13/#17 é housekeeping de baixo risco (branches
conflitantes com uma árvore que não existe mais), mas é uma ação visível a
outros colaboradores em PRs — **não executada aqui**, fica como
recomendação para decisão do responsável do projeto.

---

## 3. Dependências e conflitos

- **#42 × #43:** arquivos disjuntos (nenhuma sobreposição), sem conflito
  técnico entre si.
- **#42 × `main`:** tecnicamente `MERGEABLE`/`CLEAN` contra `main` hoje, mas
  **semanticamente prematuro** — `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md`
  descreve gaps do `tear-v2-app`, sistema que só está parcialmente em
  `main` (faltam os 7 commits da seção 1, incluindo o próprio P0-1 que essa
  auditoria motivou). Mergear #42 direto em `main` deixaria a documentação
  descrevendo um estado (P0-1 pendente) que já não é verdade no código, e
  fora do branch onde o código realmente vive.
- **#43 × `feat/ui-design-system-ela`:** `CLEAN` contra a base atual da
  branch (inclui meu commit `bca3d64`), verificado por `gh pr view`.
- **Nenhuma dependência de ordem entre #42 e #43** — ambas são adições de
  arquivo novo em `docs/`, podem entrar em qualquer ordem relativa uma à
  outra. A dependência real é de **base**, não de conteúdo.

---

## 4. Ordem segura recomendada (não executada — aguarda autorização)

```
1. Retarget PR #42: main → feat/ui-design-system-ela
   (mesma base de #43; motivo: código do domínio auditado só existe aqui)
   ↓
2. Merge #43 em feat/ui-design-system-ela
   ↓
   testes: nenhum código tocado (doc-only) — validação = build/test
   continuam verdes (backend 121/121, frontend tsc/oxlint/build já
   confirmados nesta sessão antes de #43 entrar; reconfirmar após merge
   por precaução, já que dois merges de doc não deveriam quebrar nada)
   ↓
3. Merge #42 (retargetada) em feat/ui-design-system-ela
   ↓
   testes: idem (doc-only)
   ↓
4. Abrir nova PR: feat/ui-design-system-ela → main
   (cobre os 7 commits pendentes da seção 1 + #42 + #43 já incorporadas)
   ↓
   testes: suíte completa (backend + frontend) roda no estado final antes
   do merge para main — gate real desta cadeia, é aqui que o P0-1 e a
   fundação Sprint 2.1 completa entram em produção documental
   ↓
5. Main pronto para P0-5 (próximo item da fila, já não bloqueado por
   governança de PR)
```

Itens **fora desta cadeia**, sem bloquear os próximos P0:
- #27, #1, #13, #17 — decisão de fechar/mergear é do responsável do
  projeto (ver tabela §2); nenhuma delas toca `tear-v2-app`.
- `worktree-auditoria-pre-saas` — sem PR, baixa prioridade, veredito já é
  "não agora".

---

## 5. Próximos passos

Este documento **não executa** nenhuma das 4 etapas acima. Ação sugerida
para a próxima sessão de execução: confirmar esta ordem com o responsável
do projeto (ou prosseguir sob o mandato de operação autônoma já registrado
em `CLAUDE.md`, já que nenhuma das decisões acima é regra de negócio
inédita — é só sequenciamento técnico) e então executar as etapas 1–4 em
sequência, com teste após cada merge, antes de retomar P0-5.
