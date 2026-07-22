# TEAR V2.5 — Plano da Próxima Sprint (consolidação pós-sessões paralelas)

Data: 2026-07-20
Papel do autor: Tech Lead de execução (agente), consolidação a pedido do
responsável do projeto após múltiplas sessões paralelas.
Status: **apenas consolidação/auditoria.** Nenhum código de aplicação foi
alterado para produzir este documento — só leitura, `git`/`gh`,
`php artisan test`, `tsc -b`, `oxlint`, `vite build` (verificação, sem
side effects).

---

# Estado atual

## Dois sistemas distintos no mesmo repositório

- **Sistema A — Portal GAS** (`src/`, Google Apps Script + Sheets): em
  **produção**, versão 32 publicada, todas as SPECs do `TASK_ROUTER.md`
  `[x]`. Fonte de verdade: `docs/_workspace/TASK_ROUTER.md`. Não tocado
  nesta consolidação.
- **Sistema B — `tear-v2-app`** (Laravel 13 + React 19/Vite): MVP em
  produtização, trilha ativa desta sessão. Nasceu **dentro da branch
  `feat/ui-design-system-ela`** (originalmente só sobre o Design System
  do Portal GAS) sem SPEC/ADR próprio — achado de governança já registrado
  em `TASK_ROUTER.md` §15. As PRs #40/#41 dessa branch (Design System)
  **já foram mergeadas em `main`**; os commits do `tear-v2-app` vieram
  **depois** desses merges, na mesma branch, e **não têm PR aberta**
  cobrindo-os.

## Git

- Branch atual: `feat/ui-design-system-ela`, **1 commit à frente** de
  `origin` (`bdaa563`, doc — falta `git push`, autorizado pelo mandato de
  operação autônoma).
- `tear-v2-app/` (submódulo lógico, não git): working tree limpo, nada
  pendente de commit (confirmado nesta sessão — o trabalho que 3 relatórios
  paralelos descreviam como "pendente de commit" já foi commitado em
  `bae268f`/`bdaa563`).
- 3 documentos untracked na raiz de `docs/` (ver seção "Pendências
  críticas" → Documentação).
- 4 branches remotas com auditorias completas, **nenhuma integrada** a
  `feat/ui-design-system-ela`:

| Branch | PR | Base da PR | Conteúdo |
|---|---|---|---|
| `worktree-auditoria-regras-legado` | #42 (DRAFT) | `main` | `AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` + `CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` |
| `worktree-linear-tumbling-gem` | #43 (DRAFT) | `feat/ui-design-system-ela` | `AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` |
| `worktree-auditoria-pre-saas` | **nenhuma** | — | `AUDITORIA_PRE_SAAS_TEAR_V2.md` |
| `worktree-snappy-soaring-hollerith` | já integrada | — | `AUDITORIA_MODELO_DADOS_TEAR_V2.md` (commit `84af6b5`, já no HEAD atual) |

As duas PRs abertas (#42/#43) miram **bases diferentes** (`main` vs.
`feat/ui-design-system-ela`) — inconsistência que precisa ser resolvida
antes do merge (ver Pendências críticas).

## Validação técnica (Sprint 2.1, executada nesta sessão)

- Backend: `php artisan test` → **117/117 verde**, 315 assertions.
- Frontend: `tsc -b` limpo; `oxlint` limpo (só o warning pré-existente e
  não relacionado em `src/lib/auth.tsx:72`); `vite build` conclui sem erro
  (140 módulos, ~347 kB).

---

# Entregas concluídas

## Sprint 1 — Fundação de dados e acesso
Models/migrations completos (`Parceira`, `Marca`, `Campanha`,
`ParticipacaoNaCampanha`, `Briefing`, `Material`, `Pagamento`,
`MedidaInfluenciadora`, `Consentimento`, `HistoricoAlteracao`), RBAC de
leitura por papel e dono aplicado a **todos** os recursos, fluxo de
aprovação de parceira com convite por e-mail.

## Sprint 2.1 — Primeiro acesso e perfil da influenciadora (commit `bae268f`)
Confirmado nesta sessão (backend + frontend + testes + build, ver acima):
- Fechamento do débito de posse em `Parceira` (`ParceiraPolicy::update`,
  só o dono edita; herdado da Sprint 1 §4.1).
- `GET /me/parceira`, fluxo `/definir-senha` (definição de senha via
  convite), `PortalShell` + `PortalDashboardPage` + `PortalPerfilPage`
  (dados pessoais + consentimento LGPD + medidas).
- Relatório oficial já commitado:
  `docs/RELATORIO_SPRINT_2_1_PORTAL_INFLUENCIADORA.md` (commit `bdaa563`),
  com o resumo também propagado a `TASK_ROUTER.md` §15.

## Auditorias produzidas em sessões paralelas (todas confirmadas existentes)
- `docs/AUDITORIA_MODELO_DADOS_TEAR_V2.md` — já no HEAD atual.
- `docs/AUDITORIA_REGRAS_NEGOCIO_LEGADO_TEAR.md` +
  `docs/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` — branch
  `worktree-auditoria-regras-legado`, PR #42.
- `docs/AUDITORIA_UX_PORTAL_INFLUENCIADORA.md` — branch
  `worktree-linear-tumbling-gem`, PR #43.
- `docs/AUDITORIA_PRE_SAAS_TEAR_V2.md` — branch
  `worktree-auditoria-pre-saas`, sem PR. Veredito da própria auditoria:
  **prematuro para SaaS hoje, por desenho** — recomenda completar as
  Sprints 2–4 do MVP single-tenant antes de qualquer trabalho
  multi-tenant. Não compete com as opções A/B abaixo; não é ação
  imediata.

---

# Pendências críticas

## Documentação (Etapa 2 — decisão tomada nesta consolidação)

3 documentos untracked na raiz de `docs/`:
`RELATORIO_ESTADO_ATUAL_TECH_LEAD.md`, `RELATORIO_ESTADO_TECH_LEAD_TEAR_V2.md`,
`RELATORIO_CONSOLIDACAO_SPRINT_2.md`. Os três foram produzidos por sessões
concorrentes como "fotografias de estado" do mesmo momento (working tree
com trabalho pendente de Sprint 2.1) — **conteúdo majoritariamente
duplicado entre si e hoje superado**, porque:

1. O trabalho que os três descrevem como "pendente de commit" já foi
   commitado (`bae268f`).
2. O registro oficial da entrega já existe e já está commitado:
   `docs/RELATORIO_SPRINT_2_1_PORTAL_INFLUENCIADORA.md` +
   `TASK_ROUTER.md` §15.

**Decisão:** nenhum dos três será commitado (evita a documentação
duplicada que o próprio `CLAUDE.md` proíbe) — o conteúdo com valor
permanente de cada um já foi incorporado a este plano. Os arquivos
**não foram apagados** (regra "não apagar dados" — são untracked, portanto
irrecuperáveis se removidos, e não foram criados por esta sessão). Ficam
no disco como rascunho; o responsável do projeto decide se remove
manualmente.

## Governança de branches/PRs

- PR #42 e #43 miram bases diferentes (`main` vs.
  `feat/ui-design-system-ela`) para conteúdo do mesmo domínio
  (`tear-v2-app`). Como o código de `tear-v2-app` só existe em
  `feat/ui-design-system-ela` (ainda sem PR própria para `main`), as duas
  auditorias deveriam mirar a mesma base — recomendado: **retarget de #42
  para `feat/ui-design-system-ela`**, para não aterrissar documentação
  sobre um sistema que `main` ainda não tem.
- `worktree-auditoria-pre-saas` não tem PR — baixa prioridade (achado é
  "não agora"), mas deveria ganhar uma PR em algum momento só para não
  ficar invisível a sessões futuras.
- Nenhuma PR existe ainda para levar os commits de `tear-v2-app` de
  `feat/ui-design-system-ela` para `main` — dívida represada desde
  `TASK_ROUTER.md` §14, que já cobrava isso mesmo antes do `tear-v2-app`
  existir.

## Requisitos P0 do domínio (achado central da auditoria de regras de negócio)

`docs/CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` (PR #42) identifica 5
regras de negócio críticas do Sistema A (produção) **ausentes** do
Sistema B:

| # | Regra | Risco se não resolvido antes do Portal completo |
|---|---|---|
| P0-1 | Trava de pagamento por aprovação de conteúdo | Financeiro — hoje qualquer usuário autenticado aprova pagamento sem checar material aprovado |
| P0-2 | Dados contratuais (`razao_social`, canais/prazo de uso de imagem) | Bloqueia módulo de Contratos futuro |
| P0-3 | Snapshot/congelamento de condição comercial + compilação mensal em lote | Maior impacto de desenho — decisão de PO pendente muda a tela de Campanhas/Participações |
| P0-4 | Logística (módulo inexistente no Sistema B) | Escopo grande, sem bloqueio de decisão |
| P0-5 | Cálculo automático da data de aprovação de briefing (-7 dias, ajuste de fim de semana) | Lógica isolada, sem dependência de PO além de 1 mapeamento |

4 perguntas 🟠 aguardam confirmação do PO (nenhuma bloqueia o início da
etapa como um todo — cada uma bloqueia só o item específico, mesmo padrão
já usado no `TASK_ROUTER.md` do Sistema A):
1. Pagamento exige publicação ou só aprovação do material? (P0-1)
2. `canais_uso_imagem`: lista fechada ou texto livre? (P0-2)
3. Compilação mensal em lote (modelo legado) ou vínculo individual por
   campanha (modelo atual)? (P0-3 — maior impacto)
4. `FEED` reutiliza `carrossel_qtd` ou tem contagem própria? (P0-5)

## Gap funcional do Portal (Sprint 2, itens 5–8)

Confirmado por leitura de código nesta sessão: o backend já escopa por
dono `Campanha`/`Participação`/`Briefing`/`Material`/`Pagamento`, mas o
Portal (`PortalShell`) só tem 2 rotas hoje (`/` e `/perfil`) — nenhuma
tela consome campanhas/briefings/materiais/pagamentos ainda, e o upload
de material pela própria influenciadora segue bloqueado
(`middleware('role:ADMIN')`).

---

# Próxima sprint recomendada

**Opção B primeiro (requisitos P0), não Opção A.** Razão: o próprio
documento de consolidação P0 (produzido e aprovado nesta mesma trilha de
trabalho) já define a sequência acordada — *"1. Consolidar P0 → 2. Ajustar
modelo de operação → 3. Construir portal em cima disso"* — exatamente
**para não construir tela sobre modelo que ainda vai mudar**. Dois dos 5
itens P0 tocam diretamente telas que a Opção A construiria a seguir:
P0-1 (gate de pagamento) é a regra central da tela de Pagamentos; P0-3
(congelamento/compilação) muda o comportamento de Campanhas/Participações
que a tela de Campanhas exibiria. Construir essas telas antes seria
retrabalho garantido.

Isso não descarta a Opção A — só a adia para depois da etapa 2 (ajuste de
modelo), que é de escopo pequeno (a maioria são mudanças aditivas de
schema + lógica isolada, sem UI nova).

---

# Ordem de execução

## Fase 1 — Fechar governança (baixo esforço, sem ambiguidade)
1. `git push` do commit local pendente (`bdaa563`), autorizado pelo
   mandato de operação autônoma.
2. Retarget da PR #42 para base `feat/ui-design-system-ela` (mesma base
   da #43) e merge de #42 e #43 nessa branch — nenhum conflito esperado
   (são arquivos novos em `docs/`).
3. Registrar no `TASK_ROUTER.md` a decisão sobre os 3 relatórios untracked
   (feita nesta consolidação) para não se repetir em sessão futura.

## Fase 2 — Requisitos P0 (Opção B), ordem já sugerida pela própria auditoria, priorizando risco financeiro
1. **P0-1** — trava de pagamento por aprovação de material (maior risco
   financeiro, sem schema novo).
2. **P0-5** — cálculo automático da data de aprovação de briefing (lógica
   isolada).
3. **P0-2** — campos contratuais em `parceiras` (schema aditivo).
4. **P0-4** — módulo de Logística mínimo viável (maior escopo, sem
   decisão de PO pendente).
5. **P0-3** — congelamento/compilação mensal — feito por último porque
   depende da resposta do PO sobre compilação em lote vs. individual
   (pergunta 3 acima); não deve travar os outros 4 itens.

Cada item segue o critério de aceite já definido em
`CONSOLIDACAO_REGRAS_CRITICAS_P0_TEAR_V2.md` — não redefinir aqui.

## Fase 3 — Retomar Portal da Influenciadora (Opção A), sobre o modelo já ajustado
1. Campanhas (visualização das participações ativas da própria
   influenciadora).
2. Briefings (visualização por participação, já com data de aprovação
   calculada por P0-5).
3. Materiais (upload pela influenciadora dona — abrir a rota hoje
   `role:ADMIN` para o dono da participação, mesmo padrão de posse já
   usado em `MedidaController`).
4. Pagamentos (visualização de status, já protegido pelo gate de P0-1).

Só depois da Fase 3 completa a Sprint 2 pode ser declarada concluída,
pelo critério já registrado no plano técnico original (`fb7f239`):
*"influenciadora real loga, vê só as próprias
campanhas/briefings/materiais/pagamentos, envia material pelo próprio
portal"*.

## Fora de escopo desta sprint
Preparação SaaS (multi-tenant) — por decisão da própria auditoria
(`AUDITORIA_PRE_SAAS_TEAR_V2.md`), revisitar só depois da Fase 3 acima.
