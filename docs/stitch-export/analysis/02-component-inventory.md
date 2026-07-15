# TEAR V2 — Component Inventory

Catalog of reusable UI components found across the 9 exported Stitch screens. Every entry is grounded in the actual Tailwind markup in `screens/<slug>/code.html`. Component ids (kebab-case) are stable and reused verbatim in `06-duplicated-components.md` and `07-dependency-graph.md`.

**Screen legend** (id used in tables):

| id | slug |
|----|------|
| S1 | 01-profile-and-component-library |
| S2 | 02-ux-blueprint-influencer-journey-and-portal-architecture |
| S3 | 03-ux-blueprint-interaction-and-system-logic |
| S4 | 04-approval-and-timeline-interfaces |
| S5 | 05-ux-blueprint-admin-journey-and-architecture |
| S6 | 06-universal-list-layout |
| S7 | 07-form-and-detail-view-layouts |
| S8 | 08-admin-dashboard-and-app-shell |
| S9 | 09-influencer-dashboard-and-mobile-portal |

**Design-system notes shared by all screens:** a Material 3-style token palette (`primary #9f0003`, `tertiary`, `surface*`), a recurring `1px` hairline `border-[rgba(58,56,56,0.18)]`, an editorial "quiet luxury" aesthetic (grayscale imagery, lowercase text, `font-micro` tracked labels), a "vowel-italic" display treatment, and the `:)` smiley suffix on primary CTAs. Icons are Material Symbols via `<span class="material-symbols-outlined">`.

Totals: **51 components catalogued**, of which **30 appear on 2+ screens**.

---

## Navigation

### `sidebar-nav` — Desktop Navigation Drawer
Fixed left column (256px) holding the wordmark + vertical link list; hidden on mobile.
- Signature: `hidden md:flex flex-col gap-8 p-10 bg-surface ... h-full w-64 fixed left-0 top-0 border-r border-[rgba(58,56,56,0.18)] z-40`
- Icons: (via its nav items)
- Screens: S1, S3, S4, S6, S7, S8, S9

### `sidebar-nav-item` — Sidebar Nav Link
Icon + lowercase label row; active state is `text-primary border-b-2 border-primary`, idle is `text-tertiary hover:text-on-surface hover:bg-surface-container-low`.
- Signature: `flex items-center gap-3/gap-4 text-tertiary hover:text-on-surface hover:bg-surface-container-low transition-all p-2`
- Icons: `grid_view`, `group`, `ads_click`, `check_circle`, `settings`
- Screens: S1, S3, S4, S6, S7, S8, S9

### `top-app-bar` — Mobile Top App Bar
Sticky/fixed 64px header: menu (hamburger) icon on the left, `tear v2` wordmark centered, spacer right.
- Signature: `md:hidden flex justify-between items-center w-full px-margin-mobile h-16 bg-background border-b border-[rgba(58,56,56,0.18)] ... top-0 z-40`
- Icons: `menu`
- Screens: S1, S3, S4, S6, S7, S9 *(S9 variant is always-visible, not `md:hidden`)*

### `bottom-nav` — Mobile Bottom Nav Bar
Fixed bottom bar, 80px tall, 4 evenly-spaced icon+label destinations; active is `text-primary font-bold` with `FILL 1` icon.
- Signature: `md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-background px-4 pb-safe h-20 border-t border-[rgba(58,56,56,0.18)]`
- Icons: `home`, `assignment_late`, `payments`, `person`, `ads_click`, `grid_view`, `group`, `settings`
- Screens: S1, S2 *(embedded in phone mockup)*, S4, S6, S7, S8, S9

### `bottom-nav-item` — Bottom Nav Item
Single stacked icon-over-micro-label cell inside `bottom-nav`.
- Signature: `flex flex-col items-center text-tertiary opacity-60 scale-95 transition-transform font-micro text-micro lowercase tracking-[0.18em]`
- Icons: `home`, `assignment_late`, `payments`, `person`, plus destination-specific
- Screens: S1, S2, S4, S6, S7, S8, S9

### `wordmark` — Brand Wordmark / Logotype
The `estúdio elã` (sidebar) or `tear v2` / `tear board` (top bar) display-type logo, frequently with the vowel-italic treatment.
- Signature: `font-display-sm/md text-display-sm text-primary tracking-tighter` (+ `.vowel-italic`)
- Screens: S1, S2, S3, S4, S5, S6, S7, S8, S9 (all)

### `breadcrumb` — Breadcrumb Trail
Horizontal path with `/` slash delimiters; last crumb `text-primary border-b-2 border-primary`.
- Signature: `nav flex items-center flex-wrap gap-2 font-micro text-micro lowercase tracking-widest text-tertiary` + `<span class="text-surface-dim">/</span>`
- Screens: S3

### `tab-nav-underline` — Underline Tab / Filter Nav
Row of text buttons where the active tab gets `text-primary border-b-2 border-primary pb-1` and others `text-tertiary hover:text-on-surface`. Used both as content tabs (S1: media kit / finances) and as a list filter bar (S6: all / active / pending / archived).
- Signature: `pb-4 font-body-s ... text-primary border-b-2 border-primary` / `font-micro text-micro ... text-primary border-b-[2px] border-primary pb-1`
- Screens: S1, S6

---

## Inputs / Forms

### `input-underline` — Underlined Text Input
Borderless input with a single bottom hairline that turns primary (and 2px) on focus.
- Signature: `w-full bg-transparent border-0 border-b border-[rgba(58,56,56,0.18)] p-0 pb-2 ... focus:ring-0 focus:border-primary transition-colors`
- Screens: S1, S6, S7

### `textarea-underline` — Underlined Textarea
Same underline treatment as `input-underline`, multi-line, `resize-none`.
- Signature: `w-full bg-transparent border-0 border-b ... focus:ring-0 focus:border-primary focus:border-b-2 ... resize-none`
- Screens: S4, S7

### `field-label` — Micro Field Label
Small tracked caps/lowercase label above a field; error variant switches to `text-error`.
- Signature: `font-micro text-micro tracking-widest/[0.18em] text-tertiary block mb-2 uppercase/lowercase`
- Screens: S1, S4, S6, S7

### `form-field` — Label + Input Field Group
Vertical wrapper pairing `field-label` with an `input-underline`/`textarea-underline` (often `flex flex-col relative`), sometimes with a caption/error line below.
- Signature: `div.relative.group` or `div.flex.flex-col.relative` containing label + input
- Screens: S1, S4, S6, S7

### `search-field` — Search Input with Icon
`input-underline` variant with a floating micro label and a trailing `search` icon.
- Signature: `relative w-full md:w-64` wrapper + input + `material-symbols-outlined absolute right-0 ... pointer-events-none`
- Icons: `search`
- Screens: S6

### `checkbox-custom` — Custom Checkbox
16px bordered square; checked state fills primary and renders a `check` glyph, unchecked is `border-[rgba(58,56,56,0.18)] bg-transparent`.
- Signature: `w-4 h-4 border border-primary bg-primary flex items-center justify-center` + `<span class="material-symbols-outlined text-[10px] text-on-primary">check</span>`
- Icons: `check`
- Screens: S3

### `kbd-key` — Keyboard Key Badge
Small bordered key cap for shortcut hints.
- Signature: `font-micro text-micro bg-surface border border-[rgba(58,56,56,0.18)] px-2 py-1 min-w-[32px] text-center` (also `<kbd>` / inline `esc`, `↑↓`, `enter` chips)
- Screens: S3

---

## Actions

### `btn-primary-pill` — Primary Pill Button
The signature filled CTA: full pill, `bg-primary text-on-primary`, 48px tall, often ending in `:)`.
- Signature: `h-12 bg-primary text-on-primary rounded-full font-body-s/micro ... flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`
- Icons: occasionally `arrow_forward`
- Screens: S1, S2, S3, S4, S5, S7, S8, S9

### `btn-secondary-outline` — Structural Outline Button
Square (`rounded-none`) transparent button with a hairline border; hover inverts to `bg-on-surface text-surface` (or `hover:bg-surface-container-highest`).
- Signature: `h-12 border border-[rgba(58,56,56,0.18)] bg-transparent rounded-none ... hover:bg-on-surface hover:text-surface transition-colors`
- Icons: sometimes `add`
- Screens: S1, S5, S6, S7, S8, S9

### `btn-destructive` — Destructive Button
Error-colored action: bordered text button (`text-error hover:bg-error hover:text-on-primary`) or an error icon button.
- Signature: `border border-error ... text-error hover:bg-error hover:text-on-error transition-colors`
- Icons: `delete`
- Screens: S1, S3

### `btn-icon` — Icon Button
Bare icon-only button/affordance for row and toolbar actions.
- Signature: `text-tertiary hover:text-primary/on-surface` wrapping a single `material-symbols-outlined`
- Icons: `more_horiz`, `chevron_left`, `chevron_right`, `close`, `delete`
- Screens: S3, S6

### `text-action-link` — Inline Text Action Link
Tracked micro text link for inline row actions and "view all" affordances; hover reveals a primary underline.
- Signature: `text-primary hover:text-on-background transition-colors font-micro text-micro lowercase tracking-[0.18em]` / `... border-b border-transparent hover:border-primary pb-1`
- Screens: S8

---

## Data Display

### `data-table` — Data Table
Semantic `<table>` with a hairline header row of `font-micro` tracked column labels and hairline body rows.
- Signature: `table.w-full.text-left.border-collapse` + `thead > tr.border-b` + `th.py-4 font-micro text-micro ... text-tertiary uppercase/lowercase` (S8 uses the `.hairline-table` CSS helper)
- Screens: S1, S7, S8

### `table-row` — Table Row
Body `<tr>` with `hover:bg-surface-container-low`, right-aligned numeric cells.
- Signature: `tr.border-b border-[rgba(58,56,56,0.18)] hover:bg-surface-container-low transition-colors` + `td.py-5/py-6`
- Screens: S1, S7, S8

### `list-row-grid` — Grid List Row
A record rendered on a 12-column grid (not a `<table>`): entity + status + metric columns, hover highlight, hover-revealed action. S3 adds a leading `checkbox-custom` column; S6 adds an avatar and `more_horiz`.
- Signature: `grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-5/6 hairline-b/border-b ... table-row-hover/hover:bg-surface-container-low group`
- Icons: `more_horiz` (S6)
- Screens: S3, S6

### `list-row-linear` — Linear List Row
Flex `justify-between` row: left title+caption stack, right value/icon, bottom hairline. Used for transactions (S2), shortcut mappings (S3), and milestone timeline entries (S9).
- Signature: `flex justify-between items-center py-2/4 border-b/grid-line-top border-[rgba(58,56,56,0.18)]`
- Icons: `arrow_forward` (S9)
- Screens: S2, S3, S9

### `kpi-metric-card` — KPI / Metric Card
Bordered panel presenting a `font-display-sm/md` figure with a micro label and an optional caption/trend line (with `trending_up` etc.).
- Signature: `bg-surface-container-lowest/[#f6f3ee] border border-[rgba(58,56,56,0.18)] p-6/8 flex flex-col ...` + `font-display-sm text-display-sm` number
- Icons: `group`, `ads_click`, `bar_chart`, `trending_up`, `horizontal_rule` (S8)
- Screens: S2, S8, S9

### `stat-block` — Stat Grid Block
A grid of small metric cells (label + value); S1 is a 4-up bordered stat strip, S7 is a 2×2 stat grid in the summary card.
- Signature: `grid grid-cols-2 md:grid-cols-4 ... border ...` with cells `flex flex-col ...` (`font-micro` label + `font-display-sm`/`font-body-base` value)
- Screens: S1, S7

### `avatar-image` — Image Avatar
Small square/round grayscale portrait thumbnail.
- Signature: `w-8 h-8 / w-10 h-10 rounded-full/rounded-none overflow-hidden` + `img.object-cover (grayscale)`
- Screens: S6, S8

### `avatar-initials` — Initials Avatar
Fallback avatar: monogram on a `surface-container` square when no image.
- Signature: `w-10 h-10 bg-surface-container flex items-center justify-center text-tertiary font-micro`
- Screens: S8

### `status-dot` — Status Indicator Dot
Tiny colored dot + tracked micro label conveying record state (active/pending).
- Signature: `w-2 h-2 rounded-full bg-secondary/surface-dim block` + `font-micro text-micro lowercase tracking-[0.18em] text-tertiary`
- Screens: S6

### `timeline-list` — Vertical Timeline
Vertical rail of dated events. S4 uses a left border rail with absolutely-positioned nodes; S9 uses stacked `grid-line-top` milestone rows.
- Signature: `relative pl-6 border-l border-[rgba(58,56,56,0.18)] flex flex-col gap-12` (S4) / stacked `grid-line-top pt-4 pb-4 flex justify-between` (S9)
- Icons: `arrow_forward` (S9)
- Screens: S4, S9

### `timeline-item` — Timeline Item
Single dated node: date caption + label, with state styling (past = `line-through` muted, active = `bg-primary ... animate-pulse` node, future = `opacity-50` hollow node).
- Signature: `relative` + `absolute -left-[31px] ... w-[13px] h-[13px] rounded-full` node + `font-caption` date + `font-body-base` label
- Screens: S4, S9

### `paper-panel` — Paper-Tone Panel / Card
Bordered container on the warm paper fill `#f6f3ee`, used for highlighted cards and demo canvases (collab cards, wallet balance, command-palette stage, earnings card).
- Signature: `bg-[#f6f3ee] border border-[rgba(58,56,56,0.18)] p-4/6/8/12`
- Screens: S1, S2, S3, S9

### `quick-action-card` — Quick Action Card
Clickable card: icon tile + title + caption; `group-hover:text-primary` on the icon.
- Signature: `block p-6 bg-surface-container-lowest border border-[rgba(58,56,56,0.18)] hover:bg-surface transition-colors group` + `w-12 h-12 bg-surface-container flex items-center justify-center` icon tile
- Icons: `person_add`, `campaign`, `payments`
- Screens: S8

### `pagination` — Pagination Control
Footer with a "showing X of Y" label, prev/next chevron icon buttons, and numbered page tokens (active = `text-primary font-bold`).
- Signature: `flex items-center justify-between pt-8` + `chevron_left`/`chevron_right` buttons + numbered `span`s
- Icons: `chevron_left`, `chevron_right`
- Screens: S6

---

## Feedback / Status

### `toast` — Toast Notification
Flat editorial toast with a color-coded left border for severity (`border-l-2` in tertiary/secondary/primary), leading status icon, micro category label + body, optional close.
- Signature: `w-full bg-surface* border-l-2 border-[primary|secondary|rgba...] border ... p-4 flex gap-4 items-start`
- Icons: `info`, `warning`, `check_circle`, `close`
- Screens: S3

### `inline-alert` — Inline Alert
Error banner: error-tinted box with `error` icon and title + caption.
- Signature: `border border-error/30 bg-error-container/20 p-4 flex items-start gap-3` + `material-symbols-outlined text-error`
- Icons: `error`
- Screens: S5

### `dialog-confirm` — Confirmation Dialog
Modal card with title, body copy, and a cancel / confirm (`btn-primary-pill`) action row; simulated backdrop.
- Signature: `border border-outline-variant/50 p-6 bg-surface-container-lowest shadow-sm flex flex-col gap-6 relative` + `flex justify-end gap-4` footer
- Screens: S5

### `empty-state` — Empty State
Centered icon + message + "create new" outline button for zero-data views.
- Signature: `border ... p-8 flex flex-col items-center justify-center gap-4 text-center` + large `material-symbols-outlined`
- Icons: `inbox`
- Screens: S5

### `skeleton-loader` — Skeleton Loader
Pulsing placeholder bars for loading lists.
- Signature: `h-4/h-12 w-... bg-surface-container-high animate-pulse`
- Screens: S5

### `notification-card` — Notification Card
In-app notification tile: leading icon + title + caption on a surface card (the "new task assigned" push).
- Signature: `bg-surface p-4 border border-[rgba(58,56,56,0.18)] flex gap-4 items-start` + `material-symbols-outlined text-primary`
- Icons: `notifications`
- Screens: S2

### `command-palette` — Command Palette
Spotlight-style search overlay: search row with `esc` chip, grouped result rows (active row `border-l-2 border-l-primary`), and a footer of navigation key hints.
- Signature: `w-full max-w-[600px] bg-surface border ... p-1` + search header + `p-2 ... flex flex-col gap-1` results + key-hint footer
- Icons: `search`, `auto_awesome_motion`, `group`
- Screens: S3

### `bulk-action-bar` — Floating Bulk Action Bar
Centered floating toolbar shown on multi-select: "N selected" counter + action buttons + destructive icon + close.
- Signature: `absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-highest border ... p-2 flex items-center gap-4 z-20`
- Icons: `delete`, `close`
- Screens: S3

### `upload-dropzone` — Upload Dropzone
Dashed-border drop target with an upload icon and "select file" hint.
- Signature: `w-full h-40/h-24 border border-[rgba(58,56,56,0.18)] border-dashed flex flex-col items-center justify-center text-tertiary gap-2 ... hover:bg-surface-container-low`
- Icons: `upload_file`, `upload`
- Screens: S2, S5

---

## Layout Containers

### `app-shell` — App Shell Layout
The page skeleton: `<body>` flex layout hosting `sidebar-nav` (desktop) + `main` offset by `md:ml-64` + mobile `top-app-bar` / `bottom-nav`.
- Signature: `body.bg-background text-on-background min-h-screen flex flex-col md:flex-row` + `main.flex-1 md:ml-64 ...`
- Screens: S1, S3, S4, S6, S7, S8, S9

### `page-header` — Page Header
Screen-level heading block: display title (often vowel-italic) + `font-body-lead` tertiary subtitle, sometimes with a trailing action cluster and bottom hairline.
- Signature: `header/div ... mb-* border-b border-[rgba(58,56,56,0.18)] pb-*` + `font-display-* ` h1 + `font-body-lead text-tertiary max-w-[496px]` p
- Screens: S2, S3, S4, S6, S7, S8, S9

### `section-header-micro` — Micro Section Header
Small tracked section label sitting on a bottom hairline divider, delimiting subsections/panels.
- Signature: `font-micro text-micro lowercase/uppercase tracking-widest/[0.18em] text-tertiary ... border-b border-[rgba(58,56,56,0.18)] pb-2/4`
- Screens: S3, S4, S5, S7

### `sticky-action-bar` — Sticky Form Action Bar
Fixed bottom bar (offset by the sidebar) with a blurred background holding cancel + save actions for forms.
- Signature: `fixed bottom-0 md:left-64 right-0 bg-background/90 backdrop-blur-md border-t border-[rgba(58,56,56,0.18)] p-4 flex justify-end gap-4 z-30`
- Screens: S7

### `media-player` — Media Player Frame
Aspect-ratio media frame with a grayscale image and a centered circular play affordance.
- Signature: `w-full bg-surface-container-highest border ... aspect-[16/9] md:aspect-[21/9]` + centered `w-16 h-16 border ... rounded-full` play button
- Icons: `play_arrow`
- Screens: S4

### `cover-hero` — Profile Cover Hero
Full-width 400px cover image with gradient scrim and overlaid display name + role.
- Signature: `relative w-full h-[400px] ... overflow-hidden` + `img.absolute inset-0 object-cover grayscale` + `bg-gradient-to-t from-background` scrim
- Screens: S1

### `blueprint-flow-node` — Blueprint Flow Node
Journey-map node: bordered icon box + micro caption, with a connector line to the next node; active node uses `border-primary`.
- Signature: `flex flex-col gap-4 min-w-[200px]` + `h-32 border border-outline-variant/50 ... flex items-center justify-center relative group hover:border-primary` + `absolute -right-5 ... w-10 h-px` connector
- Icons: `lock`, `dashboard`, `campaign`, `visibility`, `fact_check`, `payments`, `bar_chart`
- Screens: S5

### `editorial-grid` — 12-Column Editorial Grid
The recurring 12-col content grid (`gap-gutter`/40px) used to lay out cards, forms, and bento sections; S8 formalizes it as a `.editorial-grid` CSS class, others use `grid-cols-12`.
- Signature: `grid grid-cols-1 md:grid-cols-12 gap-gutter` / `.editorial-grid { grid-template-columns: repeat(12, minmax(0,1fr)); gap: 40px }`
- Screens: S3, S5, S7, S8
