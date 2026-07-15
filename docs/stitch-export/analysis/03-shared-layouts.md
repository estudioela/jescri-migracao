# Shared Layouts — TEAR V2 Stitch Export

Analysis of the 9 exported screens, grounded in the actual container markup of each
`screens/<slug>/code.html`. All screens share the same Tailwind config (estúdio elã /
TEAR V2 design tokens: `primary #9f0003`, `surface #f9f9f9`, `w-64` drawer, `container-max
1026px`, `gutter 40px`, hairline borders `rgba(58,56,56,0.18)`, `font-display-*` = IvyPresto,
`font-body-*` = Inter). The differences below are structural (scaffold), not stylistic.

Two families exist: **app-shell screens** (6) and **UX-blueprint documentation screens** (3).

---

## A. App Shells (the reusable scaffolds)

### A1. Admin App Shell (desktop-first)
**Canonical screen:** `08-admin-dashboard-and-app-shell`
**Structure (from markup):**
- Fixed left navigation drawer: `<nav class="bg-surface h-full w-64 fixed left-0 top-0 border-r ... hidden md:flex flex-col gap-8 p-10 z-50">` — brand lockup `estúdio elã` + `<ul>` of 5 links.
- Main canvas offset by the drawer: `<main class="flex-1 md:ml-64 ... max-w-container-max mx-auto ...">`.
- Mobile bottom nav: `<nav class="md:hidden fixed bottom-0 left-0 w-full ... h-20 border-t">`.
- Some variants also add a mobile top app bar (`md:hidden ... h-16 fixed top-0`) with a `menu` icon + `tear v2` wordmark.

**Sidebar links (identical across all app-shell screens):** dashboard · influencers · campaigns · approvals · settings. Every `href="#"` (placeholder). The active item is marked with `text-primary border-b-2 border-primary`.

**Screens that use this shell (DESKTOP unless noted):**
| Screen | deviceType | Sidebar active item | Content template (see B) |
|---|---|---|---|
| 08 admin dashboard | DESKTOP | dashboard | Dashboard grid |
| 06 universal list | DESKTOP | campaigns | Universal List |
| 07 form & detail | DESKTOP | influencers | Form / Master-Detail |
| 04 approval & timeline | DESKTOP | approvals | Timeline + Approval |
| 01 profile & component lib | MOBILE* | settings | Profile + Component Lab |

*01 is tagged MOBILE and renders `html class="dark"` (the only dark-mode screen), but its scaffold is the same fixed `w-64` drawer + `md:ml-64` main + bottom nav. It is really a style/component reference page, not a production route.

**Anomaly — mixed bottom nav:** On the canonical dashboard (08) the mobile bottom nav is *admin-flavoured* (`dash · creators · campaigns · settings`). But screens 01/04/06/07 reuse the *influencer* bottom nav (`home · tasks · wallet · profile`) even though their desktop sidebar is the admin one. So the admin content templates ship with the influencer mobile tab bar.

### A2. Influencer Mobile Portal Shell
**Canonical screen:** `09-influencer-dashboard-and-mobile-portal` (deviceType MOBILE, `width 780`)
**Structure (from markup):**
- Top app bar: `<header class="... fixed docked full-width top-0 z-40">` → `menu` button, centered `tear v2` wordmark, spacer.
- Scrolling main content: `<main class="flex-1 w-full max-w-container-max mx-auto ... pt-24 pb-32 flex flex-col md:flex-row gap-gutter">`.
- Bottom tab bar: `<nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around ... h-20 border-t">` → 4 tabs: **home · tasks · wallet · profile** (icons `home`, `assignment_late`, `payments`, `person`).
- A desktop drawer is also present (`hidden md:flex ... w-64 fixed left-0`) but — anomaly — it carries the **admin** 5-link list (dashboard/influencers/campaigns/approvals/settings), not influencer routes. On mobile that drawer is hidden and the bottom tab bar is the real portal nav.

So the influencer portal = **top app bar + vertically scrolling content + bottom tab bar (home/tasks/wallet/profile)**; it is mobile-first (`min-height: max(884px, 100dvh)`).

---

## B. Content Templates (what fills the shell's `<main>`)

These are the reusable page bodies. Each rides inside shell A1 or A2.

### B1. Dashboard grid — `08` (DESKTOP)
Editorial 12-col grid (`.editorial-grid` = `grid-template-columns: repeat(12,1fr); gap:40px`).
- KPI row: three `col-span-12 md:col-span-4` bordered cards (active influencers / live campaigns / avg roi).
- Body: `col-span-8` "pending approvals" hairline `<table>` + `col-span-4` "quick actions" stacked cards. Header has export/new-campaign buttons.

### B2. Universal List Layout — `06` (DESKTOP)
Header (title + underlined search input + `new` button) → **filter bar** (`all · active · pending · archived` tabs + `filter_list` filters) → **responsive data table**: desktop uses a 12-col grid header (`hidden md:grid grid-cols-12`) with rows as `grid grid-cols-1 md:grid-cols-12` (stacked cards on mobile, table on desktop) → **pagination footer** (`showing 1-3 of 24`, chevrons, page numbers). Columns: campaign name / influencer / status / budget.

### B3. Form & Detail (Master-Detail) — `07` (DESKTOP)
Two-pane layout: `<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">`
- Left `lg:col-span-4` **sticky summary card** (`lg:sticky lg:top-24`): avatar, name, stat grid, action buttons.
- Right `lg:col-span-8`: form sections (underline inputs) + a recent-campaigns `<table>`.
- **Sticky bottom action bar** (`fixed bottom-0 md:left-64 ... backdrop-blur`) with cancel / save changes.

### B4. Timeline + Approval — `04` (DESKTOP)
Two-column `grid lg:grid-cols-12`:
- Left `lg:col-span-4` **vertical operational timeline** (`border-l` rail with past = line-through, active = pulsing primary node + "review now", future = dimmed).
- Right `lg:col-span-8` **approval interface**: media player block (`aspect-[16/9]` with play button) + "feedback & decision" panel (comments textarea, request-revisions / approve-content buttons).

### B5. Profile + Component Lab — `01` (MOBILE, dark)
Profile section: full-width cover image + display-xl name + 4-cell stats grid (`grid-cols-2 md:grid-cols-4`, bordered) + tabs (media kit / finances) + collaboration cards. Then a **"component lab"** reference section: inputs (standard/error), actions (primary pill / structural / destructive), and a data-structure `<table>`. Functions as the design-system swatch/component gallery.

### B6. Influencer Dashboard body — `09` (MOBILE)
Hero "action required / submit content" block → 12-col row with **pending-earnings card** (`col-span-4`) + **upcoming milestones timeline** (`col-span-8`, `grid-line-top` rows with `arrow_forward`) → aesthetic image block ("curated briefs" + view-opportunities). Rides in shell A2.

---

## C. UX Blueprint screens (documentation, NOT app routes)

These three are diagram/spec boards. They deliberately **suppress the app shell** (03 even has HTML comments: `Side Navigation Anchor (Web) - Suppressed per rules (Documentation page intent)`). They document flows; they are not navigable product pages.

### 02 — UX Blueprint: Influencer Journey & Portal Architecture (MOBILE)
Header: "ux journey board / influencer mobile — a blueprint of the core influencer lifecycle, visualizing interaction moments, navigation architecture, and progressive disclosure." Body is section **"01. core loop"**: three 320×600 phone mockups in sequence — **Notification** ("new task assigned") → **Upload Content** ("submit your draft" / "submit for approval") → **Wallet** ("available balance", "payment confirmed"), the last showing the portal bottom nav (home/tasks/wallet/profile). Documents the influencer happy-path loop and the mobile tab architecture.

### 03 — UX Blueprint: Interaction & System Logic (DESKTOP, width 2560)
Header: "tear v2 / system design — interaction & navigation architecture." Bento grid of interaction primitives:
- **01 command palette** — `cmd+k` spotlight, "search campaigns, influencers, or actions".
- **02 navigation path** — breadcrumb pattern `admin / campaigns / fall 24 / briefing` (slash delimiter).
- **03 universal list & bulk actions** — multi-select rows + floating action bar (2 selected → approve / reject / delete).
- **04 notification stack** — editorial toast system (info / warning / success, color-coded left border).
- **05 keyboard mappings** — `cmd+k` search, `a` approve, `r` reject, `c` new briefing.
Documents *how* the admin interacts (shortcuts, palette, bulk ops, toasts) rather than screen-to-screen routing.

### 05 — UX Blueprint: Admin Journey & Architecture (DESKTOP, width 6000, blueprint paper grid)
Header: "tear board — admin ux journey blueprint v1.0." Three panels:
- **1. the journey flow** (primary architectural path): `authentication → dashboard → campaigns → detail view → content approval → payments → reports`.
- **2. content approval flow details**: success path / revision path / error path (upload-failed alert).
- **3. system states**: loading skeleton, empty state (no campaigns → create new), confirmation dialog (finalize payment?).
Documents the end-to-end admin journey and the state matrix behind the app screens.

---

## Summary

- **2 app shells:** Admin App Shell (A1, desktop-first, fixed w-64 drawer + ml-64 main + bottom nav) shared by screens 08/06/07/04/01; Influencer Mobile Portal Shell (A2, top bar + scroll + bottom tab bar) = screen 09.
- **6 content templates:** dashboard grid (08), universal list (06), master-detail form (07), timeline+approval (04), profile+component-lab (01), influencer dashboard (09).
- **3 blueprints** are documentation boards (02 influencer loop, 03 interaction/system logic, 05 admin journey/states) and are not product routes.
- **Anomalies:** (1) admin content screens 01/04/06/07 carry the *influencer* mobile bottom nav; (2) the influencer portal (09) desktop drawer lists *admin* routes; (3) all nav `href="#"` — no real links; (4) screen 01 is the only dark-mode screen and is really a component gallery.
