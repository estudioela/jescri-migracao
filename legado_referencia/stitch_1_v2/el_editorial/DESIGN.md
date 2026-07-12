---
name: Elã Editorial
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#59413e'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8d706d'
  outline-variant: '#e1bfbb'
  surface-tint: '#af2e28'
  primary: '#7f050a'
  on-primary: '#ffffff'
  primary-container: '#a1231f'
  on-primary-container: '#ffb7af'
  inverse-primary: '#ffb4ab'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#00425f'
  on-tertiary: '#ffffff'
  tertiary-container: '#005a80'
  on-tertiary-container: '#90d0fc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#8e1313'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#8ecef9'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#004c6d'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-editorial:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  display-editorial-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.1'
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
---

## Brand & Style

The design system is built for a high-end influencer portal where editorial authority meets functional simplicity. The brand personality is sophisticated, confident, and direct. 

The aesthetic is a hybrid of **Minimalism** and **Modern Editorial**. It leverages heavy white space, extreme typographic contrast, and a strict adherence to a "Red & White" color rule. To maintain a contemporary, approachable feel, the interface prioritizes **lowercase text-transform** across headings and labels, breaking traditional formal conventions in favor of a modern, rhythmic flow. The UI is optimized for Google Apps Script environments, ensuring high performance through CSS-driven layouts rather than heavy assets.

## Colors

The palette is intentionally restricted to create a powerful brand signature. 

- **Primary (#a1231f):** Used for critical actions, branding elements, and high-impact editorial accents.
- **Surface (#ffffff):** The dominant background color to ensure a clean, gallery-like feel.
- **Contrast (#1a1a1a):** Reserved strictly for body text readability.

Interactive elements toggle between red and white. Avoid using grays; depth is achieved through thin red strokes or solid red blocks rather than shadows.

## Typography

The system utilizes a sharp contrast between a functional Sans-Serif and a sophisticated Serif. 

- **Libre Caslon Text (Italic):** Replaces IvyPresto for the editorial voice. Use this for pull quotes, featured headers, and "story" moments. It should always be italicized to signify the editorial "Elã" touch.
- **Hanken Grotesk:** Replaces Acumin Pro as the primary interface typeface. It is clean, geometric, and highly legible.

**Lowercase Rule:** All UI labels, buttons, and headlines (excluding body paragraphs where legibility is paramount) must be set to `text-transform: lowercase`.

## Layout & Spacing

This design system follows a **mobile-first, fluid-to-fixed** philosophy. 

1. **Grid:** Use a simple 12-column grid for desktop and a single-column stack for mobile. 
2. **Padding:** Generous internal padding (24px+) within containers to prevent the UI from feeling "crowded," maintaining the minimalist aesthetic.
3. **Alignment:** Left-aligned layouts are preferred to mimic editorial magazine spreads.
4. **Rhythm:** Spacing should be multiples of 8px. Use `lg` (40px) or `xl` (64px) for section vertical spacing to emphasize the premium nature of the portal.

## Elevation & Depth

This design system rejects shadows and blurs. Depth is communicated through **Flat Tonal Layering** and **Stark Outlines**.

- **Level 0:** Pure white background (`#ffffff`).
- **Level 1:** Elements defined by a 1px solid border in Primary Red (`#a1231f`).
- **Interaction:** Depth is signaled by color inversion. A white button with a red border becomes a solid red button with white text on hover/active states.

There are no z-axis shadows. Information hierarchy is created solely through scale, typography, and color blocking.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Every button, input field, card, and image container must have square corners. This architectural rigor reinforces the minimalist, high-fashion editorial feel and ensures a seamless fit within the Google Apps Script container environment without complex CSS radius calculations.

## Components

### Buttons
- **Primary:** Solid Red background, white text, 0px radius, lowercase. 16px horizontal padding.
- **Secondary:** White background, 1px Red border, red text, 0px radius, lowercase.

### Input Fields
- **Text Inputs:** 1px Red bottom-border only (minimalist style) or full 1px Red box. Background must be white. Placeholder text in lowercase.
- **Focus State:** 2px Red bottom-border.

### Cards & Containers
- No shadows. Use a 1px Red border or a subtle Red-tinted background for differentiation.
- Headlines within cards must use the editorial serif italic for a "magazine" feel.

### Chips & Tags
- Red background with white lowercase text. No rounded corners.

### Lists
- Separated by 1px Red horizontal rules. No bullet points; use typographic weight to distinguish list items.

### Navigation
- Mobile: A simple top-bar with a red logo and a text-based "menu" label (lowercase).
- Desktop: Minimalist sidebar with red active-state indicators (left-border 4px).