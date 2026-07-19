# UI Visual Handoff — TEAR V2

> Relatório de passagem da sessão de implementação visual de 2026-07-19.
> Estado do repositório: Fase 1 (fundação Elã) e Fase 2 (redesign do
> `admin.html`) implementadas e validadas — lint limpo, 719/719 testes,
> conferência visual no preview (`npm run preview`). Alterações **não
> commitadas** (aguardando revisão do responsável).

---

## 1. Arquivos usados como fonte visual

| Arquivo | Papel |
|---|---|
| `src/ui/portal-head.html` | Fundação CSS anterior (tokens `--tear-*` verdes) — base técnica preservada, valores substituídos |
| `src/ui/*.html` (13 páginas) | Levantamento de componentes e padrões reais em uso |
| `UI_ARCHITECTURE.md` | Princípios oficiais da camada de apresentação |
| `NAVIGATION.md` | Fluxos de navegação do Portal |
| `src/entrypoint/Portal.js` | Mapa real de rotas `?pagina=` |
| `scripts/preview-server.mjs` | Validação visual com dados simulados (não é fonte de estilo) |

## 2. Referências Stitch utilizadas

Projeto Stitch **"TEAR V2 Design System Foundations"**
(id `11523235260562339932`, conta `elafashionmkt@gmail.com`), via o export
read-only versionado no repo. **Não há servidor MCP Stitch conectado a este
ambiente** — a fonte é exclusivamente o export.

Telas de referência (conforme as análises):

- **Tela 08 — Admin Dashboard & App Shell**: template aplicado no redesign do
  `admin.html` (linha de KPIs → aprovações pendentes → quick actions).
- **Tela 06 — Universal List Layout**: referência para tabelas/listas (Fase 3).
- **Tela 09 — Influencer Dashboard & Mobile Portal**: referência para o
  dashboard da Parceira e shell mobile (Fases 3–4).
- Telas 02/03/05 são blueprints de UX (documentação), não layouts.

⚠ **Limitação herdada**: as pastas `screens/` (HTML das telas) e `assets/` do
export não existem mais no repo; sobraram 3 das 7 análises. A análise
`05-design-tokens-per-screen.md` nunca foi gerada (pré-requisito P3 do roadmap).

## 3. Arquivos do Design System Elã consultados

Não existe pacote de DS Elã separado no repositório, e o MCP claude-design
retornou **zero design systems cadastrados** para esta conta. O DS Elã está
materializado nas análises do export Stitch:

- `docs/stitch-export/analysis/03-shared-layouts.md` — **fonte primária dos
  tokens** (cabeçalho: `primary #9f0003`, `surface #f9f9f9`, `w-64` drawer,
  `container-max 1026px`, `gutter 40px`, hairline `rgba(58,56,56,0.18)`,
  `font-display-*` = IvyPresto, `font-body-*` = Inter) e dos dois app shells.
- `docs/stitch-export/analysis/02-component-inventory.md` — 51 componentes
  catalogados; assinaturas Tailwind de cada um; estética "quiet luxury"
  (micro-labels lowercase tracked, vowel-italic, sufixo `:)` em CTAs,
  Material Symbols).
- `docs/stitch-export/analysis/04-navigation-relationships.md` — hierarquia de
  navegação admin/influencer.
- `docs/stitch-export/README.md` — roster de telas, procedência e status do export.

(`docs/referencias/TEAR_V2_OFICIAL.xlsx` não foi usado como fonte visual.)

## 4. Tokens e componentes derivados dessas fontes

### Tokens (em `src/ui/portal-head.html` `:root`)

| Token | Valor | Procedência |
|---|---|---|
| `--tear-primary` | `#9f0003` | Stitch, confirmado |
| `--tear-canvas` | `#f9f9f9` | Stitch (`surface`), confirmado |
| `--tear-line` | `rgba(58,56,56,.18)` | Stitch (hairline), confirmado |
| `--tear-container-max` / `--tear-gutter` | `1026px` / `40px` | Stitch, confirmado |
| `--tear-font-display` | IvyPresto → **Fraunces** (fallback ativo) | Stitch; kit Adobe pendente (P2) |
| `--tear-font-body` | Inter | Stitch, confirmado |
| `--tear-ink` | `#262424` | **derivado** (base `#3a3838` da hairline) — refinar pós P3 |
| `--tear-muted` | `#6d6a6a` | **derivado** — refinar pós P3 |
| `--tear-primary-hover` | `#7a0002` | **derivado** |
| `--tear-danger/success/info` (+`-bg`/`-line`) | herdados da fundação anterior | fora do escopo do DS Elã (mantidos por necessidade funcional) |
| `--tear-radius` `2px` / `--tear-radius-pill` | interpretação do editorial Elã | pill confirmado nos CTAs Stitch |
| `--tear-space-1..5` | escala 8px | interpretação (gutter 40 confirmado) |

### Componentes CSS criados (classes em portal-head)

`.micro` (rótulo lowercase tracked 0.18em) · `.secundario` (botão outline) ·
`.paper-panel` · `.alert` + `.info/.ok/.erro` · `.empty-state` · `.amplo`
(container 1026px) · `.eyebrow` · `.wordmark` · `.kpi-grid/.kpi-card/
.kpi-rotulo/.kpi-valor` · `.badge` · `.item-lista/.item-info/.item-titulo/
.item-acoes` · `.acoes-grid` + `button.acao`/`.destaque`/`.acao-descricao` ·
ícones Material Symbols Outlined (webfont carregada no partial).

Mapeamento para o inventário Stitch: `btn-primary-pill`, `btn-secondary-outline`,
`paper-panel`, `kpi-metric-card`, `quick-action-card`, `inline-alert`,
`empty-state`, `field-label`, `wordmark`, `status/badge`.

## 5. Localização dos arquivos no projeto

```
src/ui/portal-head.html                  ← DS aplicado (tokens + componentes)
src/ui/admin.html                        ← única página migrada (Fase 2)
docs/stitch-export/README.md             ← procedência do export Stitch
docs/stitch-export/analysis/*.md         ← fonte dos tokens/componentes Elã
docs/stitch-export/_raw/list_screens.json← roster completo (17 telas)
UI_AUDIT_REPORT.md                       ← auditoria (raiz)
UI_DESIGN_SYSTEM_GAP_ANALYSIS.md         ← gap analysis (raiz)
UI_IMPLEMENTATION_ROADMAP.md             ← roadmap 4 fases (raiz)
auditoria/admin-antes-fase2.png          ← screenshot antes (Fase 1)
auditoria/admin-depois-fase2.png         ← screenshot depois (Fase 2)
```

## 6. Próximo passo recomendado

1. **Refinamento "central operacional" do admin** — solicitado ao fim desta
   sessão e **ainda não implementado** (um edit parcial foi revertido para
   manter o repo no estado validado). Plano já traçado, sem backend novo:
   - bloco "precisa da sua atenção" com contadores **reais** via contratos
     existentes `listarEntregas`/`listarPagamentos` (`{token, mesReferencia}`);
   - painel de competência com progresso real de entregas (não arquivadas vs
     arquivadas) e pagamentos (`EmAberto`/`Aprovado` vs `Pago`);
   - "problemas operacionais" e progresso de cadastro/briefing **sem backend
     de leitura** → marcar "futura integração";
   - ações operacionais como cards compactos horizontais (icon + título +
     descrição via wrapper `.acao-texto`).
2. Commit/PR das mudanças atuais após aprovação do responsável.
3. Fase 3 na ordem do roadmap (`login` → `dashboard` → `perfil` → …), uma
   página por unidade de trabalho.
4. Destravar pendências: **P2** (kit Adobe Fonts para IvyPresto real) e
   **P3** (re-export Stitch para tokens secundários exatos).

> Decisão vigente registrada em memória do agente e no roadmap: adoção
> **integral** do DS Elã (2026-07-19), sem tema paralelo — não reabrir a
> discussão verde × vinho.
