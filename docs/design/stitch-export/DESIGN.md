---
name: Tear Editorial
colors:
  surface: '#fef8f8'
  surface-dim: '#ded9d8'
  surface-bright: '#fef8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2f2'
  surface-container: '#f2edec'
  surface-container-high: '#ece7e6'
  surface-container-highest: '#e6e1e1'
  on-surface: '#1d1b1b'
  on-surface-variant: '#5e3f3b'
  inverse-surface: '#323030'
  inverse-on-surface: '#f5efef'
  outline: '#926e69'
  outline-variant: '#e8bdb6'
  surface-tint: '#c00004'
  primary: '#9f0003'
  on-primary: '#ffffff'
  primary-container: '#cd0005'
  on-primary-container: '#ffdbd6'
  inverse-primary: '#ffb4a9'
  secondary: '#a63931'
  on-secondary: '#ffffff'
  secondary-container: '#ff7b6f'
  on-secondary-container: '#731311'
  tertiary: '#4e4d4a'
  on-tertiary: '#ffffff'
  tertiary-container: '#666561'
  on-tertiary-container: '#e6e3de'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930002'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#86211d'
  tertiary-fixed: '#e5e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#474743'
  background: '#fef8f8'
  on-background: '#1d1b1b'
  surface-variant: '#e6e1e1'
typography:
  display-xl:
    fontFamily: notoSerif
    fontSize: 96px
    fontWeight: '300'
    lineHeight: '0.95'
    letterSpacing: 0.02em
  display-lg:
    fontFamily: notoSerif
    fontSize: 64px
    fontWeight: '300'
    lineHeight: '1.05'
    letterSpacing: 0.02em
  display-md:
    fontFamily: notoSerif
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.05'
    letterSpacing: 0.02em
  display-sm:
    fontFamily: notoSerif
    fontSize: 36px
    fontWeight: '300'
    lineHeight: '1.05'
    letterSpacing: 0.02em
  h3:
    fontFamily: notoSerif
    fontSize: 26px
    fontWeight: '300'
    lineHeight: '1.10'
  h4:
    fontFamily: hankenGrotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.10'
  body-l:
    fontFamily: hankenGrotesk
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.60'
  body-base:
    fontFamily: hankenGrotesk
    fontSize: 16px
    fontWeight: '300'
    lineHeight: '1.60'
  body-s:
    fontFamily: hankenGrotesk
    fontSize: 15px
    fontWeight: '300'
    lineHeight: '1.60'
  caption:
    fontFamily: archivoNarrow
    fontSize: 13px
    fontWeight: '300'
    lineHeight: '1.45'
  micro:
    fontFamily: hankenGrotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.60'
    letterSpacing: 0.18em
  display-lg-mobile:
    fontFamily: notoSerif
    fontSize: 36px
    fontWeight: '300'
    lineHeight: '1.10'
spacing:
  s-1: 4px
  s-2: 8px
  s-3: 12px
  s-4: 16px
  s-5: 24px
  s-6: 32px
  s-7: 48px
  s-8: 64px
  s-9: 96px
  s-10: 140px
  gutter: 40px
  container-max: 1026px
---

## Brand & Style

This design system is built on the philosophy of **Quiet Luxury** and **Editorial Minimalism**. It rejects traditional SaaS tropes—soft shadows, vibrant gradients, and rounded corners—in favor of a high-fashion, print-magazine aesthetic. The UI must feel like a digital edition of *Vogue* or *Self Service*: authoritative, disciplined, and spacious.

The brand personality is sophisticated and dry, evoking an emotional response of prestige and exclusivity. The style is a hybrid of **Minimalism** and **Brutalism**, utilizing:
- **Absolute Flatness:** Zero box-shadows or depth effects.
- **High-Contrast Ground Flips:** Alternating between stark white and blood-red section blocks.
- **Structural Asymmetry:** Balancing large typographic elements against generous "respiro" (breathing room).
- **Hairline Precision:** Using 1px rules to define structure without adding visual weight.

## Colors

The palette is a strict, high-contrast selection that prioritizes legibility (WCAG AA compliant) and an editorial feel.

- **Primary (#CD0005):** "Bordô" (Blood Red). Used for direction, active states, and high-impact section backgrounds.
- **Secondary (#791815):** "Vinho" (Wine). Reserved for punctuation, supporting serif headings, and subtle highlights.
- **Tertiary (#f6f3ee):** "Paper." A warm off-white surface that replicates premium physical stationery for cards or sidebars.
- **Neutral (#3a3838):** "Charcoal." Used for primary body text to avoid the harshness of pure black while maintaining a 11.2:1 contrast ratio.
- **Accent Background (#efe9df):** "Paper-Warm." Used for high-priority containers or presentation covers.
- **True Black (#000000):** Strictly for display wordmarks and maximum-contrast display typography.

**Rules of Use:**
- **Light Grounds:** Use Charcoal text and Blood Red accents.
- **Red Grounds:** Use White text and White 1px rules (Rule Soft).

## Typography

Typography is the primary driver of hierarchy and brand voice. 

**Typographic Rules:**
- **Institutional Lowercase:** All headings, navigation items, buttons, and labels must be rendered in lowercase. Capitalization is only for proper nouns in body copy.
- **Vowel Italic (Signature Motif):** For all `notoSerif` (IvyPresto proxy) headings, every vowel should be rendered in *Light Italic*, while consonants remain upright. This creates a rhythmic, bespoke texture.
- **Micro Labels:** Always set to `11px` with a generous `--track-out` (0.18em) to evoke architectural labeling.
- **Verbal Tone:** Remove all marketing fluff. Use direct, concrete nouns and absolute restraint. The only allowed emoticon is `:)`.

## Layout & Spacing

This design system uses a **Fixed Grid** model for maximum content control, centered within a tight `1026px` container.

- **The Respiro Strategy:** Vertical section padding is extremely generous, defaulting to `140px` (s-10) to elevate the perceived value of the content.
- **Asymmetrical Columns:** Typically, layouts split into a left-aligned header column (~320px) and a right-aligned narrative column (~496px), separated by an 80px gap.
- **Grid Discipline:** Elements should align perfectly to the left edge of the container grid. Empty space should be left on the right rather than stretching elements to fit.
- **Responsiveness:** 
    - **1100px:** Asymmetrical grids stack vertically; horizontal padding locked at 40px.
    - **768px:** Section padding reduces to 80px. Display headings scale to a maximum of 36px.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **High-Contrast Ground Flips** rather than shadows. 

- **Flatness:** Box-shadows are strictly prohibited. The UI is perceived as a series of flat, stacked surfaces.
- **Hairline Rules:** Use `1px` borders to define containers and separate list items. On light backgrounds, use a charcoal rule with 18% opacity. On red backgrounds, use a white rule with 30% opacity.
- **Contrast as Elevation:** A change from white to a red background or a "Paper" (beige) background indicates a new functional zone or a shift in hierarchy.

## Shapes

The shape language is **Sharp (0)**. 

Every UI element—including cards, input fields, and section blocks—must have a corner radius of `0px` to maintain the architectural and editorial rigor of the design system. 

**The Single Exception:** 
High-priority Call-to-Action (CTA) buttons are the *only* elements allowed to be **Pill-shaped** (`radius: 999px`). This singular curve draws immediate focus amidst the strict 90-degree environment.

## Components

### Buttons
- **Primary:** Pill-shaped (48px height, 208px width). Solid Blood Red with white bold text on light grounds. 
- **Hover:** Inverts to a 1px Red border with transparent background and red text using a `0.4s` cubic-bezier transition.
- **Label:** Lowercase, bold, 15px sans-serif.

### Accordions
- **Structure:** Full-width rows with 1px hairline rules top and bottom.
- **Interactions:** On hover, the title (`26px` serif) smoothly underlines and the weight shifts to bold. The icon (a simple `+`) rotates 180 degrees.
- **Transition:** Content drawer uses a `0.6s` decelerating ease.

### Input Fields
- **Styling:** Sharp corners (radius 0), 1px charcoal border. No focus shadows; focus is indicated by a weight change in the label or a change in border color to Blood Red.
- **Labels:** Use the `micro` typography style (11px, uppercase/spaced) positioned above the field.

### Section Blocks (Not Cards)
- Conventional "Cards" are rejected. Use full-width or grid-aligned section blocks with flat background colors (White, Paper, or Red). 
- If a data container is required (e.g., for SaaS metrics), use a sharp-cornered box with a 1px border rule.

### The "Estrela" (North Star)
- A decorative, hand-drawn six-point star used as a subtle watermark or anchor. It must never substitute for the wordmark.