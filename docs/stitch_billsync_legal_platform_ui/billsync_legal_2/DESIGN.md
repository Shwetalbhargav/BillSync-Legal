---
name: BillSync Legal
colors:
  surface: '#f7f9ff'
  surface-dim: '#d1dbe8'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e4effd'
  surface-container-high: '#dfe9f7'
  surface-container-highest: '#d9e3f1'
  on-surface: '#121d26'
  on-surface-variant: '#43474e'
  inverse-surface: '#27313c'
  inverse-on-surface: '#e8f2ff'
  outline: '#73777f'
  outline-variant: '#c3c6cf'
  surface-tint: '#3d608a'
  primary: '#002546'
  on-primary: '#ffffff'
  primary-container: '#123b63'
  on-primary-container: '#83a6d4'
  inverse-primary: '#a6c9f9'
  secondary: '#4d5f7d'
  on-secondary: '#ffffff'
  secondary-container: '#c8dbfe'
  on-secondary-container: '#4e607e'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cea72c'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a6c9f9'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#234871'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#b5c7ea'
  on-secondary-fixed: '#071c36'
  on-secondary-fixed-variant: '#364764'
  tertiary-fixed: '#ffe08e'
  tertiary-fixed-dim: '#ecc246'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#f7f9ff'
  on-background: '#121d26'
  surface-variant: '#d9e3f1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for the legal tech sector, specifically focusing on building trust and reducing cognitive load during complex billing workflows. The brand personality is **Professional, Human, and Guided**, moving away from traditional "cold" legal software toward a "calm and premium" workspace.

The visual style is **Corporate Modern with a Warm Minimalist influence**. It prioritizes extreme legibility and a sense of order. By using a cream-based background rather than clinical white, the interface feels sophisticated and reduces eye strain for lawyers during long review sessions. The emotional goal is to evoke **confidence and precision**, ensuring users feel supported rather than overwhelmed by data.

## Colors
The palette is rooted in a sophisticated, academic tradition updated for modern digital use. 

- **Primary & Secondary:** Navy (#0B1F3A) and Primary Blue (#123B63) anchor the design, providing the "Institutional" weight required for legal applications.
- **Background:** The Cream (#F8F5EF) background is the foundation of the "Warm Minimalist" feel, differentiating the product from standard SaaS white.
- **Accent:** Gold (#C9A227) is used sparingly for highlighting "Premium" status or "Verified" actions, ensuring it remains an accent rather than a dominant color.
- **Functional:** Charcoal and Grey handle text hierarchy, while the semantic colors (Success, Warning, Error) follow standard conventions but are adjusted for high contrast against the cream background.

## Typography
This design system utilizes **Inter** exclusively to ensure maximum legibility and a systematic, utilitarian feel that lawyers find familiar and reliable. 

Hierarchy is established through weight and color (Charcoal for headings, Grey for body) rather than excessive size changes. For data-heavy tables, use `body-sm` to maintain information density without sacrificing clarity. All labels use a slight letter spacing and bold weight to distinguish them from interactive text.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. On desktop, content is contained within a 12-column grid (max-width 1440px) to prevent line lengths from becoming unreadable. 

The spacing rhythm is **generous and intentional**, utilizing the "base 4" system. Large margins (40px) and gutters (24px) are essential to maintain the "Calm" brand pillar, ensuring that even complex legal bills have "room to breathe." Components should favor vertical stacking with clear separation to prevent the UI from feeling cluttered.

## Elevation & Depth
Depth is created through **Tonal Layering and Soft Shadows**. 

1.  **Base Layer:** The Cream background (#F8F5EF).
2.  **Surface Layer:** Pure white (#FFFFFF) containers/cards used to separate content from the cream background.
3.  **Shadows:** Use extremely soft, low-opacity shadows (Color: #0B1F3A at 4% alpha, Blur: 12px, Y-Offset: 4px) for cards. 
4.  **Interaction:** Hover states on interactive elements should increase the shadow spread slightly rather than changing the background color drastically, maintaining the tactile, premium feel.
5.  **Borders:** Use the Border color (#E5E7EB) for subtle definition on all input fields and secondary containers.

## Shapes
The design system uses a **Soft (0.25rem)** roundedness profile. This strike a balance between the "Sharp/Formal" nature of legal work and the "Human/Approachable" tone of the design system. 

- **Standard Buttons & Inputs:** 4px (0.25rem)
- **Cards & Modals:** 8px (0.5rem)
- **Status Chips:** Full pill (100px) to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use Navy (#0B1F3A) with White text. Secondary buttons use the Border (#E5E7EB) with Charcoal text. 
- **Input Fields:** Fields must have a white background to "pop" against the cream page. Use the Border (#E5E7EB) for the rest state and Primary (#123B63) for the focus state with a 2px stroke.
- **Cards:** Cards are the primary container. They must be pure white with the soft navy-tinted shadow defined in Elevation.
- **Status Chips:** Used for "Bill Status" (Pending, Paid, Overdue). They should use low-opacity versions of the semantic colors (Success, Warning, Error) with dark text for accessibility.
- **Data Tables:** Legal billing requires high-density tables. Use `body-sm` for rows and `label-md` for headers. Use subtle horizontal dividers in Border (#E5E7EB) rather than full grids.
- **Empty States:** Use the Gold (#C9A227) accent in illustrations or icons for empty states to keep the mood "Optimistic" and "Guided."