---
name: Estúdio Elã
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f2f2'
  surface-container: '#f1edec'
  surface-container-high: '#ece7e7'
  surface-container-highest: '#e6e1e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5d3f3b'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#916f6a'
  outline-variant: '#e6bdb7'
  surface-tint: '#bf0506'
  primary: '#8f0002'
  on-primary: '#ffffff'
  primary-container: '#bc0004'
  on-primary-container: '#ffc8c0'
  inverse-primary: '#ffb4a9'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e4'
  on-secondary-container: '#626566'
  tertiary: '#0033ba'
  on-tertiary: '#ffffff'
  tertiary-container: '#0045f3'
  on-tertiary-container: '#ccd3ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930002'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#444748'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b9c3ff'
  on-tertiary-fixed: '#001356'
  on-tertiary-fixed-variant: '#0034bf'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e6e1e1'
typography:
  display-lg:
    fontFamily: ebGaramond
    fontSize: 64px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: ebGaramond
    fontSize: 40px
    fontWeight: '300'
    lineHeight: '1.1'
  headline-md:
    fontFamily: ebGaramond
    fontSize: 32px
    fontWeight: '300'
    lineHeight: '1.2'
  headline-md-mobile:
    fontFamily: ebGaramond
    fontSize: 24px
    fontWeight: '300'
    lineHeight: '1.2'
  title-sm:
    fontFamily: ebGaramond
    fontSize: 20px
    fontWeight: '300'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: archivoNarrow
    fontSize: 12px
    fontWeight: '300'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: archivoNarrow
    fontSize: 10px
    fontWeight: '300'
    lineHeight: '1'
    letterSpacing: 0.08em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 96px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The brand personality is sophisticated, avant-garde, and strictly editorial. It draws inspiration from European fashion magazines, emphasizing intellectual minimalism and the rhythmic use of negative space. 

The design style is **Editorial Neo-Brutalist**: a blend of classic typography and raw, structural layouts. It rejects all skeuomorphic tendencies—no shadows, no gradients, and no blurs. Instead, it relies on hairline strokes, sharp corners, and a radical commitment to a paper-like tactile experience. High whitespace is not a "gap" but a primary structural element that directs the eye and establishes hierarchy. All text follows a strict lowercase convention to maintain an egalitarian, modern aesthetic.

## Colors
The palette is rooted in a warm "paper" base, moving through five subtle tiers of ivory and grey to create a sense of physical layering without using depth effects. 

- **Primary Accent:** Bordeaux (#bc0004) is used sparingly for critical actions and brand markers. It must always be paired with white text for maximum legibility and impact.
- **Hairlines:** A 1px border using `rgba(116, 120, 120, 0.2)` is the only method allowed for separating elements or defining structure.
- **Strict 2D:** No color should ever be used in a gradient. All backgrounds are solid fills.

## Typography
Typography is the core of the design system's identity. 

1. **Lowercase Convention:** All text, including titles, proper nouns (where legally possible), and button labels, must be rendered in lowercase.
2. **The Signature Style:** For Display and Headline levels, use **ebGaramond (300)**. To evoke the editorial aesthetic, use alternating italics on specific characters or words within a string to create a rhythmic "visual lisp."
3. **Body Copy:** While Helvetica Neue is preferred for local environments, **Inter** serves as the digital equivalent, providing clean, neutral legibility in lowercase.
4. **Metadata:** **Archivo Narrow** is used for labels, dates, and micro-copy, utilizing light tracking (letter spacing) to enhance the technical, archival feel.

## Layout & Spacing
The layout follows a **Fixed-Grid** philosophy on desktop and a **Fluid-Grid** on mobile. 

- **Desktop (1280px+):** A 12-column grid with wide 64px outer margins. Elements should feel "hung" on the grid, often leaving entire columns empty to emphasize whitespace.
- **Mobile:** A 4-column fluid grid with 16px margins. 
- **Vertical Rhythm:** Use the 4px base unit. Component spacing should be aggressive—larger than standard defaults—to allow every element to "breathe." 
- **Hairlines:** Use hairlines to define sections when whitespace alone is insufficient. Hairlines should span the full width of their container.

## Elevation & Depth
Depth is strictly communicated through **Tonal Layering** and **Structural Framing**.

- **No Shadows:** Shadows are forbidden.
- **Surface Tiers:** Use the background variables (v1 through v4) to denote hierarchy. The base background (#fcf8f8) is the lowest level. Secondary content sits on v1 or v2.
- **Borders:** Thin, low-opacity hairlines (1px) define the boundaries of cards and input fields.
- **Motion:** Depth is reinforced by motion rather than visuals. Elements should use a `fade-up` transition (300ms to 600ms) with a `cubic-bezier(0.4, 0, 0.2, 1)` easing to enter the frame, suggesting a physical reveal.

## Shapes
The shape language is primarily **Sharp (0px)**. This reinforces the neo-brutalist and editorial influence, mimicking the edges of a cut piece of paper.

- **Containers & Cards:** 0px radius.
- **Inputs & Fields:** 0px radius.
- **Exceptions:** Primary Action Buttons are the sole exception. They utilize a **Pill Shape (999px)**. This contrast ensures that the primary call-to-action is instantly recognizable against the otherwise rigid, rectilinear environment.

## Components
- **Primary Buttons:** Pill-shaped, #bc0004 background, #ffffff text, lowercase Archivo Narrow. No shadow.
- **Secondary Buttons:** Sharp corners (0px), 1px hairline border, #1c1b1b text, lowercase Archivo Narrow.
- **Inputs:** 0px radius, 1px bottom-border only (hairline), lowercase placeholder text in #747878.
- **Chips/Labels:** Sharp corners, background #f1edec, lowercase Archivo Narrow, no border.
- **Icons:** Material Symbols Outlined. Stroke weight: 300. Never use filled variants. Icons should be sized at 20px or 24px and inherit the color of the adjacent text.
- **Cards:** Defined by a 1px hairline border or a subtle tonal shift (surface-v1) with 0px radius. Whitespace within cards should be generous (minimum 24px padding).
- **Lists:** Separated by horizontal hairlines. High line-height (1.6) for list items to maintain the editorial feel.