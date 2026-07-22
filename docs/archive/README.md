# Archive — Documentos históricos do TEAR V2

Este diretório reúne relatórios, planos, auditorias e checkpoints que já
cumpriram sua função: eram artefatos de um momento específico do processo
(sprint, auditoria, decisão de merge), e suas conclusões já foram absorvidas
por um documento canônico ativo — normalmente `docs/_workspace/TASK_ROUTER.md`.

Nenhum destes documentos é fonte de verdade. Para o estado atual do projeto,
ver sempre `docs/_workspace/TASK_ROUTER.md` (conforme `/CLAUDE.md`).

Movidos para cá em 2026-07-21, com base na auditoria de governança do
repositório (`docs/governance/REPOSITORY_GOVERNANCE_AUDIT.md`). Critério de arquivamento:
documento sem nenhuma referência ativa em `README*`, `CLAUDE.md`, `HANDOFF*`,
`docs/_workspace/TASK_ROUTER.md`, scripts ou workflows do GitHub — apenas
citações cruzadas entre si, dentro do próprio conjunto de relatórios.

## Conteúdo

Organizado por tema em subpastas (2026-07-21, reorganização física para
reduzir arquivos soltos):

### `sprints/` — planos e relatórios de execução de sprint

| Arquivo | Origem/tema |
|---|---|
| `RELATORIO_CONSOLIDACAO_SPRINT_2.md` | Auditoria de estado — Sprint 2 |
| `RELATORIO_SPRINT_1_FUNDACAO_DADOS.md` | Execução — Sprint 1 (fundação de dados) |
| `PLANO_FRONTEND_SPRINT_2_1_PORTAL_INFLUENCIADORA.md` | Plano técnico — frontend Sprint 2.1 |
| `PLANO_TECNICO_SPRINT_2_PORTAL_INFLUENCIADORA.md` | Plano técnico completo — Sprint 2 |
| `PLANO_IMPLEMENTACAO_TEAR_V2.5.md` | Plano de execução — Sprints 1-5 (V2.5) |

### `auditorias/` — auditorias e diagnósticos técnicos

| Arquivo | Origem/tema |
|---|---|
| `AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` | Comparação de regras — Sistema A vs Sistema B |
| `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` | Auditoria de UX — Portal da Influenciadora |
| `AUDITORIA_MODELO_DADOS_TEAR_V2.md` | Auditoria — modelo de dados (Sistema B) |
| `DIAGNOSTICO_AUTENTICACAO_TEAR_V2.md` | Diagnóstico confirmando achado já registrado |

### `pagamento-snapshot/` — cadeia de decisão sobre pagamento/snapshot mensal

| Arquivo | Origem/tema |
|---|---|
| `PLANO_IMPLEMENTACAO_SNAPSHOT_MENSAL.md` | Revisão conceitual — snapshot mensal (Sistema B) |
| `ANALISE_MODELO_PAGAMENTO_RECORRENTE_TEAR_V2.md` | Análise técnica — pagamento recorrente |
| `CHECKPOINT_POS_ANALISE_PAGAMENTO_SNAPSHOT.md` | Checkpoint de sessão |
| `IMPLEMENTACAO_P0_GATE_PAGAMENTO.md` | Registro de implementação — gate de pagamento P0-1 |

### `consolidacao-branches/` — merges, estado entre sessões paralelas e marcos

| Arquivo | Origem/tema |
|---|---|
| `PLANO_MERGE_CONSOLIDACAO_TEAR_V2.md` | Plano de merge de branches/PRs |
| `PLANO_PROXIMA_SPRINT_TEAR_V2.md` | Consolidação entre sessões paralelas |
| `RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md` | Execução de merges/consolidação de branches |
| `RELATORIO_ESTADO_ATUAL_TECH_LEAD.md` | Fotografia de estado — Tech Lead |
| `RELATORIO_ESTADO_TECH_LEAD_TEAR_V2.md` | Auditoria de estado (worktree paralelo) |
| `ARCHITECTURE_FREEZE_FINAL.md` | Gate de congelamento da Fase 4 (specs), 2026-07-14 |
