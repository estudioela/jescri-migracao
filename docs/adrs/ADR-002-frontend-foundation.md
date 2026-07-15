# ADR-002 — Frontend Foundation: elã-native UI Component Library on Apps Script HTML Service

- **Status:** Proposed
- **Date:** 2026-07-14
- **Supersedes / relates to:** ADR-001 (fail-fast, enums). Feeds Roadmap V2 Phase 2 ("Portal da Parceira").
- **Decision owner:** (human author to confirm)

## Context

TEAR V2 needs a frontend for the first time (currently only ACL/Repository data layers exist). Three sources of truth govern it, in this precedence:

1. **Visual — Estúdio Elã Design System** (imported zip): palette, typography, motion, spacing, iconography, brand rules.
2. **Layout / Information Architecture — Stitch** project *TEAR V2 Design System Foundations* (`11523235260562339932`), exported read-only to `docs/stitch-export/`.
3. **Business rules — project documentation** (`PROJECT_GOVERNANCE.md`, `CONTRATO_SOBERANO.md`, etc.).

Hard constraints from governance:
- `PROJECT_GOVERNANCE.md §5.1`: V2 is an **evolution of the Apps Script/Sheets architecture — not a technological rewrite**. This excludes a React/SPA production stack.
- `PROJECT_GOVERNANCE.md §3.3`: frontend contract is **HTML Service + `google.script.run`**, envelope `{success,data}` / `{success,error}`.
- `PROJECT_GOVERNANCE.md §2` / `DIRETRIZES §2`: organize by **execution boundary**, single source of truth per concept, no duplication.
- `CLAUDE.md`: no architecture change without an ADR (this document).

The Design System ships its components as **React JSX** (reference only). The Stitch screens are built with **Tailwind + Inter + Material Symbols** (structural placeholders only). Neither is the production format.

## Decision

Build a **reusable UI component library in vanilla HTML / CSS / JavaScript**, delivered as **Apps Script HTML Service `include()` partials**, derived from the elã Design System and structured to match the Stitch IA. No React, no bundler, no npm in production. This is the *reusable design foundation only* — no business features, no screens, no data wiring. Stitch will compose screens from these components later.

### Precedence reconciliation (visual wins over structure)

| Concern | Source | Rule |
|---|---|---|
| Color, type, motion, spacing, radii, icons | elã DS | authoritative |
| Which components/shells/screens exist & how they connect | Stitch export | authoritative |
| Fonts | elã DS | DS fonts replace Stitch's Inter |
| Icons | elã DS | custom **line SVG** (`currentColor`) replace Material Symbols icon-font |
| Corners / shadows | elã DS | radius-0 (pill CTA only); hairline rules, **no shadows/gradients** |
| Brand red | both agree | `#CD0005` (Stitch already uses `#cd0005`); legacy `#a1231f` retired |

### Architecture — four normalized layers

```
webapp/                              # HTML Service presentation tier (execution boundary)
  design-system/
    tokens/
      ds-tokens.css                  # normalized from colors_and_type.css (single source of truth)
      fonts.html                     # ISOLATED font loader (Typekit piy8ljr + fallback), see Fonts
    primitives/                      # button, input, select, textarea, badge/status-pill, avatar,
                                     # icon (line-svg), type utilities, hairline-rule, link, norte-divider
    components/                      # app-shell-admin, app-shell-influencer, nav-sidebar, data-table(+row),
                                     # filter-bar, pagination, stat-card, form-detail (master + sticky
                                     # summary + sticky action bar), timeline-item, approval-card,
                                     # dashboard-grid, tabs, modal, breadcrumb, toast, command-palette,
                                     # bulk-action-bar
    patterns/                        # (JS, progressive enhancement) vowel-italic.js, accordion.js,
                                     # tabs.js, modal.js, toast.js, command-palette.js  (GSAP optional)
    assets/                          # logo-ela.svg, norte-icon.svg, contact line-icons, (fonts via Typekit)
    include.js                       # HtmlService include() helper
    gallery.html                     # brand-book / kitchen-sink verification page
docs/adrs/ADR-002-frontend-foundation.md   # this record
```

- **Primitives + DS components** (button, accordion, nav, section, footer, wordmark, norte) come from the elã zip.
- **Structural components** (app shells, data-table, filter-bar, pagination, stat-card, form-detail, timeline, dashboard-grid, tabs, modal, breadcrumb, toast, command-palette, bulk-action-bar) come from the Stitch layouts analysis (`docs/stitch-export/analysis/03-shared-layouts.md`) — **re-skinned** in the elã visual language.
- **Two app shells** (per Stitch `03`): admin (fixed sidebar + top bar + main) and influencer (top bar + bottom tab bar).
- **No duplicate components:** each recurring Stitch pattern maps to exactly one library component.

### Fonts (per approved decision)

- Loaded **only** in `tokens/fonts.html` (dedicated include). Adobe Typekit kit `piy8ljr` for IvyPresto Display / Helvetica Neue.
- **Graceful degradation:** if Typekit is unavailable the app keeps working, falling back to the predefined stack (Cormorant Garamond ≈ display, Archivo, Helvetica/Arial).
- **No base64 embedding** of licensed fonts.
- Typography exposed **only through tokens** — `--font-display`, `--font-heading`, `--font-body` (+ existing `--font-sans`, `--font-sans-2`) — so the provider can change without touching any component.

### Interaction patterns

Vanilla JS modules, progressive enhancement (components render and are usable without JS). Ports the DS's canonical `vowel-italic.js` (DOM-walker) and accordion behavior; adds tabs/modal/toast/command-palette controllers derived from Stitch blueprint `03`. CSS tokens (`--ease-out`, `--dur-*`) cover micro-motion; GSAP scroll-reveal is an optional layer, never required.

### Verification

`gallery.html` renders every token swatch, primitive, and component in both light and `.on-red` grounds. Served via `clasp`/HTML Service (or opened locally), it confirms the elã look end-to-end **before any real screen is built**. This is the acceptance surface for the foundation.

## Scope boundaries (explicit non-goals)

- No business features, no `google.script.run` calls, no ACL/Repository/Service/Controller changes.
- No actual screens — screen composition & navigation come from Stitch later.
- No production deploy (agents never publish; operator-controlled).

## Consequences

**Positive:** governance-compliant (no tech rewrite, HTML Service native, clasp-friendly); single visual source of truth via tokens; swappable font provider; components ready for Stitch-driven screen composition; additive (zero risk to data layers).

**Negative / debt:**
- Structural components must be hand-re-skinned from Stitch markup (one-time cost).
- Typekit dependency for exact display fidelity (mitigated by fallback + token indirection).
- **Deferred (recorded debt):** 5 of 7 Stitch analysis docs (`01-screen-inventory`, `02-component-inventory`, `05-design-tokens-per-screen`, `06-duplicated-components`, `07-dependency-graph`) were not generated (session limit) — regenerate from `docs/stitch-export/screens/*/code.html` post-reset; they will refine the exact component roster below. Full-resolution screenshots also pending.

## Open items for the implementation plan

- Confirm the exact component roster once `02-component-inventory` / `07-dependency-graph` are regenerated.
- Decide whether `webapp/` is the final tier name (vs `portal/`) with the human owner.
- HTML Service `include()` wiring details (templated `<?!= include('...') ?>`).
