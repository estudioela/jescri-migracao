# Stitch Export — TEAR V2 Design System Foundations

> Read-only export and documentation of a Stitch project. **No application code was modified.** This package only *exports, organizes and documents* the Stitch source. It is reference material for the future TEAR V2 frontend; it is not itself the application.

- **Project title:** TEAR V2 Design System Foundations
- **Project id:** `11523235260562339932`
- **Stitch account:** `elafashionmkt@gmail.com` (GCP quota project `projeto-influenciadora`)
- **Screens exported:** 9 (of 17 in the project — the 9 requested)
- **Exported:** 2026-07-14

## How this was exported (reproducible)

There is **no `stitch` MCP server** connected to this environment, and the stitch-mcp CLI 0.9.0 `proxy`/`tool` commands reject credentials by default (the auth-wiring bug tracked upstream in `davideast/stitch-mcp#181`). The working path is the CLI `tool` command with an explicit gcloud access token **and `GOOGLE_CLOUD_PROJECT`** (the README's documented `STITCH_PROJECT_ID` is not the variable the client reads):

```bash
export STITCH_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"
export GOOGLE_CLOUD_PROJECT="projeto-influenciadora"
BIN=@_davideast/stitch-mcp   # v0.9.0

# per screen:
npx $BIN tool get_screen_code  -d '{"projectId":"11523235260562339932","screenId":"<id>"}'   # -> .htmlContent
npx $BIN tool get_screen_image -d '{"projectId":"11523235260562339932","screenId":"<id>"}'   # -> .imageContent (base64 PNG)
npx $BIN tool list_screens     -d '{"projectId":"11523235260562339932"}'                     # -> metadata + downloadUrls
```

Hosted image assets and full-resolution screenshots were pulled with `curl -L` from the `lh3.googleusercontent.com` download URLs.

## Folder structure

```
docs/stitch-export/
├── README.md                      # this file — merged report + index
├── _raw/
│   └── list_screens.json          # authoritative listing of all 17 project screens
├── screens/
│   └── NN-<slug>/
│       ├── code.html              # generated HTML (Tailwind-based)
│       ├── image.png              # rendered screenshot (full-res via curl -L)
│       ├── image-thumb.png        # 512px base64 render from get_screen_image (kept for reference)
│       └── screen.json            # metadata: title, deviceType, width, height, download URLs
├── assets/                        # hosted assets, curl -L, host/path hierarchy preserved
│   ├── lh3.googleusercontent.com/aida-public/…   # 10 real image assets
│   ├── cdn.tailwindcss.com…/                      # Tailwind runtime (deduped, once)
│   ├── fonts.googleapis.com/…                     # Google Fonts CSS (deduped)
│   ├── fonts.gstatic.com/…
│   └── manifest.tsv               # url -> referencing screens
└── analysis/                      # the 7 required analyses (see index below)
```

## Screen roster

| # | Screen | id | device | full-res px |
|---|--------|----|--------|-------------|
| 1 | Profile & Component Library | `f64cf46c096e4bd6ad3ea7700b75650c` | MOBILE | — |
| 2 | UX Blueprint: Influencer Journey & Portal Architecture | `55e729526dc043e5acd421d7972eff0b` | MOBILE | — |
| 3 | UX Blueprint: Interaction & System Logic | `ad40a1c31ca74e92a81d28843008e152` | MOBILE | — |
| 4 | Approval & Timeline Interfaces | `4043673c19ab4b0b91373397d2563533` | MOBILE | — |
| 5 | UX Blueprint: Admin Journey & Architecture | `9d956b43600e4dfb805055c795bf85e7` | MOBILE | — |
| 6 | Universal List Layout | `56c77a3aac35495b962273e5adf99bfa` | MOBILE | — |
| 7 | Form & Detail View Layouts | `c7ac80afd67044a098fc0fbb5349a010` | MOBILE | — |
| 8 | Admin Dashboard & App Shell | `5edceae3784b4414b7b37086bd96556f` | MOBILE | — |
| 9 | Influencer Dashboard & Mobile Portal | `9f4a82c02d2e470b91bdd196c62c6b47` | MOBILE | — |

(Three of the nine — screens 2, 3, 5 — are "UX Blueprint" documentation screens describing journeys/architecture rather than concrete UI.)

## Analysis index

| # | Requirement | Document |
|---|-------------|----------|
| 1 | Screen inventory | [`analysis/01-screen-inventory.md`](analysis/01-screen-inventory.md) |
| 2 | Reusable component inventory | [`analysis/02-component-inventory.md`](analysis/02-component-inventory.md) |
| 3 | Shared layouts | [`analysis/03-shared-layouts.md`](analysis/03-shared-layouts.md) |
| 4 | Navigation relationships | [`analysis/04-navigation-relationships.md`](analysis/04-navigation-relationships.md) |
| 5 | Design tokens per screen | [`analysis/05-design-tokens-per-screen.md`](analysis/05-design-tokens-per-screen.md) |
| 6 | Duplicated components across screens | [`analysis/06-duplicated-components.md`](analysis/06-duplicated-components.md) |
| 7 | Dependency graph (screen → component) | [`analysis/07-dependency-graph.md`](analysis/07-dependency-graph.md) |

## Status of this package (accurate as of export)

**Export artifacts — COMPLETE & verified (9/9 screens):** `code.html`, `image.png` (512px render), `screen.json`, and 10 hosted image assets, all integrity-checked. `image.png` is currently the 512px `get_screen_image` render; full-resolution screenshots (`curl -L` from the `screenshot.downloadUrl`) are a pending quality upgrade.

**Analysis documents — 2 of 7 complete:**

| Doc | State |
|-----|-------|
| `03-shared-layouts.md` | ✅ complete |
| `04-navigation-relationships.md` | ✅ complete |
| `01-screen-inventory.md` | ⏳ deferred (session limit) |
| `02-component-inventory.md` | ⏳ deferred (session limit) |
| `05-design-tokens-per-screen.md` | ⏳ deferred (session limit) |
| `06-duplicated-components.md` | ⏳ deferred (session limit) |
| `07-dependency-graph.md` | ⏳ deferred (session limit) |

The five deferred analyses can be regenerated after the session-limit reset from the already-exported `screens/*/code.html` (no re-fetch from Stitch needed).

## Merged findings (from completed analyses)

**Layouts (`03`):** two reusable app shells — **admin app shell** (desktop-first: fixed `w-64` left drawer + top bar + main; canonical screen `08`, reused by `01/04/06/07`) and **influencer mobile portal shell** (top app bar + scrolling content + bottom tab bar; screen `09`). Six content templates: dashboard grid, universal list (header+filters+table+pagination), master-detail form, timeline+approval, profile/component-lab, influencer dashboard. Three **UX Blueprint** screens (`02/03/05`) are documentation, not app routes.

**Navigation (`04`):** two roots — **admin** (root `08`; sidebar → dashboard/influencers/campaigns/approvals/settings; list→detail→approval→payments→reports) and **influencer** (root `09`; bottom tabs home/tasks/wallet/profile). Key anomalies: all `href="#"` (relationships inferred from labels/active-state/blueprints); `payments`+`reports` exist only in blueprint `05`; screen `01` is the only dark-mode screen (a component gallery mapped to the `settings` slot).

<!-- MERGED_FINDINGS -->
