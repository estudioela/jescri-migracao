# Portal Estúdio Elã — SPA

Unified, navigable version of the 8 isolated Stitch screens (`login`, `dashboard`,
`briefing`, `envio de material`, `pagamentos`, `perfil`, `histórico`, `painel admin`).
No build tools — plain HTML/CSS/JS, Tailwind via CDN.

## Structure

```
app.html            entry point: shared <head>, shell placeholders, view outlet
router.js           hash-based router + view interactions
styles/main.css      consolidated custom CSS (was duplicated per-screen)
components/         shared header, bottom nav, footer — fetched once at startup
views/               one fragment per screen, injected into #view-outlet
est_dio_el/DESIGN.md the Elã design-system source of truth (unchanged)
```

## Running locally

`fetch()` needs http(s), not `file://`:

```
cd stitch_portal_est_dio_el_ui
python3 -m http.server 8080
```

Open `http://localhost:8080/app.html`.

## Deploying

- **GitHub Pages**: push this folder, enable Pages, done — `app.html` can be
  set as the entry via a redirecting `index.html` if the host requires one.
- **Apps Script iframe**: host this folder wherever (GitHub Pages, any static
  host) and point an `<iframe src="...">` at it from the Apps Script UI. This
  is a static client-only app — it does not call the existing Apps Script
  backend (`Sincronizador.js` / `WebApp.js`); wiring that up is a separate task.

## What changed vs. the raw Stitch export

- One shared header/bottom-nav/footer instead of 8 slightly different copies
  (perfil's fixed sidebar, historico's bare header, admin's own header markup
  were all normalized to the same shell).
- `border-radius` forced to `0` everywhere except the pill CTA, matching
  `DESIGN.md`'s "hard edges, one exception" rule — some screens shipped with
  `0.25rem` defaults that violated their own design system.
- Login: the Stitch export used generic email + password fields; replaced
  with a single cupom field (same visual language: label + hairline input +
  pill CTA) since the actual Portal Estúdio Elã has no account system, only
  coupon-based access.
- Dead `href="#"` links that had an obvious destination were wired up
  (dashboard campaign rows → briefing, briefing's download button → upload).
  Links with no clear target (terms/privacy/contact, "view all", "load
  archive") were left as visual-only, unchanged.
- Upload screen's static demo file rows (one uploading, one done, one failed)
  were replaced with a real dropzone that lists whatever files you add and
  fake-animates their progress — closer to "navigable product" than a frozen
  screenshot.
