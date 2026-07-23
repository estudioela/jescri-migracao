# Archive — Documentos históricos do TEAR V2

Este diretório reúne relatórios, planos, auditorias e checkpoints que já
cumpriram sua função: eram artefatos de um momento específico do processo
(sprint, auditoria, decisão de merge), e suas conclusões já foram absorvidas
por um documento canônico ativo — normalmente `docs/_workspace/TASK_ROUTER.md`.

Nenhum destes documentos é fonte de verdade. Para o estado atual do projeto,
ver sempre `docs/_workspace/TASK_ROUTER.md` (conforme `/CLAUDE.md`).

Movidos para cá em 2026-07-21, com base na auditoria de governança do
repositório (hoje também arquivada, ver `auditorias-historicas/REPOSITORY_GOVERNANCE_AUDIT.md`).
Critério de arquivamento: documento sem nenhuma referência ativa em `README*`,
`CLAUDE.md`, `HANDOFF*`, `docs/_workspace/TASK_ROUTER.md`, scripts ou
workflows do GitHub — apenas citações cruzadas entre si, dentro do próprio
conjunto de relatórios.

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
| `PLANO_FINAL_CONGELAMENTO_OPERACIONAL.md` | Plano de arquitetura — congelamento de Participação (P0-2). Decisão real extraída para `docs/adrs/ADR-018-congelamento-de-participacao-trava-simples.md` (2026-07-23) — o plano propunha um modelo completo (cópia de dados de Parceira + auditoria) só parcialmente implementado; a ADR documenta o gap. |

### `consolidacao-branches/` — merges, estado entre sessões paralelas e marcos

| Arquivo | Origem/tema |
|---|---|
| `PLANO_MERGE_CONSOLIDACAO_TEAR_V2.md` | Plano de merge de branches/PRs |
| `PLANO_PROXIMA_SPRINT_TEAR_V2.md` | Consolidação entre sessões paralelas |
| `RELATORIO_CONSOLIDACAO_FINAL_TEAR_V2.md` | Execução de merges/consolidação de branches |
| `RELATORIO_ESTADO_ATUAL_TECH_LEAD.md` | Fotografia de estado — Tech Lead |
| `RELATORIO_ESTADO_TECH_LEAD_TEAR_V2.md` | Auditoria de estado (worktree paralelo) |
| `ARCHITECTURE_FREEZE_FINAL.md` | Gate de congelamento da Fase 4 (specs), 2026-07-14 |

### `consolidacao-mvp-completa/` — reconciliação dos 4 documentos trazidos pelo merge `worktree-spec-mvp-completa` (2026-07-22)

| Arquivo | Origem/tema | Motivo do arquivamento |
|---|---|---|
| `ESPECIFICACAO_FUNCIONAL_TEAR_V2.5.md` | Especificação funcional (2026-07-20) | Superset verificado linha a linha, sem contradições, em `ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` (ver `planejamento-pre-codigo/` abaixo — também arquivado em 2026-07-23) |
| `BACKLOG_EXECUTIVO_MVP.md` | Backlog de execução do MVP (2026-07-20) | Registro histórico de execução (EPIC 1-6, majoritariamente concluído); backlog vigente é `docs/planning/BACKLOG_FUNCIONAL_V2_6.md`. HU-3.5 (CPF) marcada como superada por CD-01 |
| `PLANO_EXECUCAO_MVP.md` | Sequenciamento por ondas do MVP (2026-07-20) | Ondas 0-2 concluídas; sequenciamento vigente rastreado por `docs/_workspace/TASK_ROUTER.md` + `docs/planning/BACKLOG_FUNCIONAL_V2_6.md` |
| `DECISAO_TAXONOMIA_MATERIAL_BRIEFING.md` | Decisão Material×Briefing (2026-07-20) | Decisão já implementada (HU-4.1), sem canônico correspondente — registro histórico |

### `planejamento-pre-codigo/` — ensaio de planejamento pré-código (2026-07-22)

Movidos com base em `docs/reports/AUDITORIA_SIMPLIFICACAO_DOCUMENTAL.md` e
`docs/reports/PLANO_EXECUTIVO_SIMPLIFICACAO_DOCUMENTAL.md` (Fase 1). Os 8
arquivos abaixo compartilham a mesma origem: ensaio de planejamento gerado
antes de qualquer código do Sistema B (`tear-v2-app/`) existir, com estrutura
repetitiva de seções e citações externas de blog sem relação com o TEAR.
Validação em duas rodadas (leitura estrutural + amostragem distribuída de
conteúdo, cruzada contra `CONTRATO_SOBERANO.md`, ADRs, SPECs, migrations/
models reais do Laravel e páginas reais do frontend) não encontrou nenhuma
informação exclusiva — o conhecimento vigente já está em documentos muito
mais curtos e específicos.

| Arquivo | Origem/tema | Motivo do arquivamento |
|---|---|---|
| `DATA_MODEL.md` | Modelo de dados teórico (DDD, Aggregate Root/Value Object) | 5.814 linhas; entidades (`Competência`, `Colaboração_Mensal`) sem correspondência em nenhum sistema real. Canônico: `docs/history/CONTRATO_SOBERANO.md` + ADRs + SPECs |
| `DATABASE_MODEL.md` | Modelo relacional teórico | 2.998 linhas; zero ocorrência de `competencia`/`colaboracao_mensal` em todo o código real (confirmado por grep). Já autoflag do próprio projeto em `ESTADO_SESSAO.md` §4. Canônico: migrations reais (`tear-v2-app/backend/database/migrations/*.php`) + `docs/history/PLANILHA_TEAR_2.0_MAPA.md` |
| `DOMAIN.md` | Glossário/"Linguagem Ubíqua" teórico | 3.863 linhas; vocabulário divergente do real (Campanha/Participação/Briefing/Material). Canônico: `docs/history/CONTRATO_SOBERANO.md` + `docs/PRD.md` |
| `TEAR.md` | Glossário de domínio, variante | 2.083 linhas; mesmo padrão, nomenclatura parcialmente mais próxima do real mas ainda teórica. Já autoflag do próprio projeto. Canônico: `docs/history/CONTRATO_SOBERANO.md` + SPECs |
| `MIGRATION.md` | Filosofia de migração de banco | 3.986 linhas, 100% agnóstica de tecnologia; convenção de nome (`M001_CriarTabelaMarca`) nunca usada nas migrations reais. Canônico: as próprias migrations reais do Laravel |
| `SCREEN_MAP.md` | Mapa de telas pré-implementação | 2.013 linhas; nomes de tela não batem com as páginas reais (ex.: "Competências"/"Colaborações" não existem; real é `CampanhasListPage`/`CampanhaDetailPage`). Canônico: páginas reais em `tear-v2-app/frontend/src/pages/*.tsx` |
| `STITCH_PROTOTYPE.md` | Fundamentos de protótipo (ferramenta Stitch) | 1.327 linhas, pré-implementação, sem decisão técnica vinculante. Canônico: `docs/design/stitch-export/DESIGN.md` (tokens reais, confirmados contra o CSS implementado) + páginas reais |
| `UX_FLOW.md` | Especificação de UX pré-código | Maior arquivo do repositório (10.234 linhas); amostragem distribuída (início/25%/50%/75%/fim, incluindo os módulos Logística/Contratos/Histórico) não encontrou nenhum identificador específico do TEAR. Canônico: experiência real já implementada e testada (E2E via Playwright) + `docs/planning/BACKLOG_FUNCIONAL_V2_6.md` |

### `roadmaps-superados/` — roadmaps de execução substituídos (2026-07-23)

Movidos com base no plano de simplificação documental (`TASK_ROUTER.md` §28,
Fase 1 restante). Ambos declarados explicitamente substituídos por
`docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md` (plano vigente).

| Arquivo | Origem/tema | Motivo do arquivamento |
|---|---|---|
| `ROADMAP_MESTRE_TEAR_V2.md` | Roadmap de execução (Fases 0-6) | Substituído por `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md` |
| `TEAR_V2.5_PRODUCTIZACAO_ROADMAP.md` | Plano de produtização/SaaS (multi-tenant, RBAC, billing) | Substituído por `docs/planning/PLANO_MESTRE_ELA_INFLUENCIA.md` |

### `auditorias-historicas/` — auditorias e consolidações já absorvidas (2026-07-23)

Movidos com base no plano de simplificação documental (`TASK_ROUTER.md` §28,
Fase 1 restante).

| Arquivo | Origem/tema | Motivo do arquivamento |
|---|---|---|
| `REPOSITORY_GOVERNANCE_AUDIT.md` | Auditoria de organização documental do repositório (2026-07-21) | Diagnóstico pontual já executado; `docs/governance/` esvaziada e removida |
| `RELATORIO_CONSOLIDACAO_AUDITORIAS.md` | Consolidação de 3 auditorias externas (CPO, Manus AI) sobre o plano estratégico | Achados já resumidos em `docs/_workspace/TASK_ROUTER.md` §16 |

### `legado-apps-script/` — governança e operação do Portal em Google Apps Script (2026-07-23)

O Portal legado (`src/`, Google Apps Script + Sheets) e sua suíte de testes
(`test/`, Jest) foram **removidos do repositório** — decisão explícita do
responsável do projeto confirmando que o legado estava descontinuado/
substituído e que `tear-v2-app/` (Laravel + React) é a única aplicação
oficial. Antes da remoção, o algoritmo de normalização de
`ChaveInfluenciadora` (único detalhe de regra de negócio que só existia no
código, sem essa precisão em nenhuma SPEC) foi extraído para
`docs/specs/SPEC-003.md` §6.1. Ferramentagem raiz específica do GAS também
removida: `eslint.config.js`, `.clasp.json.example`, `.claspignore`,
`appsscript.json`, `scripts/preview-server.mjs`, `package.json`/
`package-lock.json` (só serviam ao legado). `README.md` (raiz) e
`knowledge/README.md` reescritos para descrever `tear-v2-app/` como o
produto oficial.

| Arquivo | Origem/tema | Motivo do arquivamento |
|---|---|---|
| `PROJECT_GOVERNANCE.md` | Governança de processo e decisões arquiteturais permanentes do Portal GAS (camadas Entrypoint→Controller→Service→Repository, envelope de resposta, `.claspignore`, roadmap "V2 é evolução do Apps Script") | Arquitetura descrita nunca se aplicou a `tear-v2-app/` (Laravel+React, decisão em `ADR-015`); código que a implementava (`src/`) foi removido; regras de processo genéricas já duplicadas em `CLAUDE.md` |
| `DEPLOY_CHECKLIST.md` | Checklist de pré-deploy/rollback do Portal GAS (abas do Google Sheets, `clasp`) | 100% específico do sistema removido; checklist de deploy vigente é `docs/release/GATE_FINAL_GO_LIVE.md`/`docs/deployment/CHECKLIST_GO_LIVE.md` |
| `ROTEIRO_HOMOLOGACAO.md` | Roteiro manual de homologação do Portal GAS (Web App publicada, `google.script.run`) | 100% específico do sistema removido |

`ESPECIFICACAO_FUNCIONAL_MVP_COMPLETA.md` (2026-07-23, movido para
`planejamento-pre-codigo/` junto com o cluster acima por ser da mesma
natureza — consolidação pré-código): a Fase 3 do plano de simplificação
documental (`TASK_ROUTER.md` §28/§42) previa fundi-lo em
`docs/planning/BACKLOG_FUNCIONAL_V2_6.md`, mas a investigação revelou que
o documento carrega **12 decisões de negócio pendentes do responsável do
projeto (§9)** e ~13 lacunas sem item equivalente no backlog — fundir
sem decisão item a item arriscava perder decisões reais em aberto.
Arquivado íntegro (sem fusão) para não perder nenhuma informação; a
consolidação seletiva fica para uma sessão dedicada, com decisão do
responsável do projeto item a item.
