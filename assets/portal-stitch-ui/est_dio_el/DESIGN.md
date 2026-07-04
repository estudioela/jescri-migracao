---
name: Estúdio Elã
colors:
  surface: '#fcf8f8'
  surface-dim: '#ddd9d9'
  surface-bright: '#fcf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c8'
  surface-tint: '#5d5f5f'
  primary: '#5d5f5f'
  on-primary: '#ffffff'
  primary-container: '#ffffff'
  on-primary-container: '#747676'
  inverse-primary: '#c6c6c7'
  secondary: '#bc0004'
  on-secondary: '#ffffff'
  secondary-container: '#e51e16'
  on-secondary-container: '#fffbff'
  tertiary: '#a63931'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffffff'
  on-tertiary-container: '#c55046'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#930002'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#86211d'
  background: '#fcf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-xl:
    fontFamily: EB Garamond
    fontSize: 80px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-xl-mobile:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.1'
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '300'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '300'
    lineHeight: '1.2'
  body-md:
    fontFamily: Helvetica Neue
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Archivo Narrow
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
  meta-xs:
    fontFamily: Archivo Narrow
    fontSize: 10px
    fontWeight: '400'
    lineHeight: '1'
spacing:
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 1px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is rooted in the high-end editorial traditions of European fashion houses and avant-garde print magazines. It prioritizes white space as a structural element rather than a void, creating an atmosphere of exclusivity, intellectual rigor, and quiet confidence.

The style is a synthesis of **Strict Minimalism** and **Neo-Brutalism**. It rejects all forms of digital artifice—no shadows, no gradients, and no blurs. Instead, it relies on structural integrity, 1px hairlines, and a sophisticated typographic rhythm to define hierarchy. The aesthetic is "Objectivist," treating every UI element as a fixed piece of a printed plate.

## Colors
The palette is dominated by a warm, paper-inspired neutral base to evoke the texture of premium uncoated stock. 

- **Primary White (#ffffff):** Used for high-contrast highlight blocks and negative space.
- **Editorial Off-whites (#f6f3ee / #efe9df):** The primary canvas colors, providing a softer, more sophisticated background than pure white.
- **Bordeaux (#cd0005) & Deep Wine (#791815):** Used sparingly for emphasis, active states, and call-to-action elements.
- **Legends Grey (#6b6b6b):** The standard color for body copy and metadata, maintaining a lower-contrast, refined appearance compared to pure black.

## Typography
Typography is the cornerstone of this design system. It follows a strict hierarchy inspired by editorial spreads.

- **Display & Titles:** Uses **EB Garamond** (as a proxy for Cormorant). For high-impact titles, employ an alternating rhythm: Light Roman for consonants and Light Italic for vowels.
- **Body Text:** Uses **Helvetica Neue** (proxied by Libre Franklin for web compatibility). All body copy, including lead paragraphs, must be strictly lowercase to maintain a modern, fashion-forward tone.
- **Labels & Metadata:** Uses **Archivo Narrow**. These are used for secondary information, dates, and category tags. Like the body, these must be lowercase.
- **Line Heights:** Generous line heights are used for body text to ensure readability against the off-white backgrounds, while display text remains tight and architectural.

## Layout & Spacing
The layout follows a strict 12-column grid on desktop, where the grid lines themselves are often rendered as 1px hairlines to create "cells" of content.

- **The Hairline Grid:** Use `#6b6b6b` (at 20% opacity) or the secondary palette to draw 1px vertical and horizontal separators between sections.
- **Margins:** Large external margins create a "frame" around the content, pushing the focus inward. 
- **Alignment:** Content should be predominantly left-aligned. Avoid centered layouts unless for specific editorial cover-style sections.
- **Reflow:** On mobile, columns stack vertically, but the 1px hairlines remain to separate content blocks, ensuring the "modular" feel is preserved.

## Elevation & Depth
This design system is strictly 2D. Depth is communicated through **layering and blocking** rather than light and shadow.

- **Tonal Blocks:** Use solid fills of the editorial off-white or white to differentiate regions.
- **Zero Effects:** Never use shadows, blurs, or any form of Z-axis elevation. 
- **Z-Index:** Layering is only used for temporary overlays (e.g., navigation menus), which should appear as solid, opaque sheets sliding over the content.
- **Grid Dominance:** The 1px hairline is the primary tool for separating information. If two elements need distinction, use a line or a color block change, never a shadow.

## Shapes
The shape language is sharply geometric. 

- **Hard Edges:** All buttons, input fields, image containers, and layout blocks must have a `0px` border radius. 
- **The Exception:** The primary "Call to Action" is the only element permitted to use a full pill-shape (`999px` radius). This creates a singular point of visual interest and tactile affordance amidst the sharp architecture.
- **Icons:** Use thin-line SVGs with a consistent `1.5px` stroke weight. Icons should be geometric and avoid rounded terminals where possible.

## Components
- **Buttons:** Primary buttons are either solid Bordeaux blocks with square corners or the exception "pill" CTA. Secondary buttons are 1px hairlines with lowercase Archivo text.
- **Navigation:** All navigation items are lowercase. Use 1px horizontal hairlines to separate the header from the main content. Active states are indicated by a change to the Bordeaux color, never an underline.
- **Cards:** Do not use cards with shadows or borders. Instead, use "Cells"—blocks of content defined by 1px hairlines on all sides, or solid blocks of alternating off-white shades.
- **Inputs:** 1px bottom-border only, using Archivo for labels. Place labels above the line in a smaller font size.
- **Motion:** Transitions should be subtle and sophisticated. Use a 300ms fade-up (opacity 0 to 1 + Y-offset 10px to 0px). Avoid all elastic or "bouncy" easing functions; use a standard `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Lists:** Unordered lists should use a simple 1px horizontal dash instead of a bullet point.