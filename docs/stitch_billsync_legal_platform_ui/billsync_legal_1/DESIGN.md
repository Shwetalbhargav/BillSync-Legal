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
  secondary: '#755b00'
  on-secondary: '#ffffff'
  secondary-container: '#fed255'
  on-secondary-container: '#735a00'
  tertiary: '#11243f'
  on-tertiary: '#ffffff'
  tertiary-container: '#283a56'
  on-tertiary-container: '#92a4c5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a6c9f9'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#234871'
  secondary-fixed: '#ffe08e'
  secondary-fixed-dim: '#ecc246'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#b5c7ea'
  on-tertiary-fixed: '#071c36'
  on-tertiary-fixed-variant: '#364764'
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
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  margin-desktop: 40px
  gutter-desktop: 24px
  sidebar-width: 260px
---

## Brand & Style
The design system for this platform prioritizes trust, clarity, and a "human-centric" legal experience. It moves away from the cold, intimidating aesthetics of traditional legal software toward a warm, guided, and premium SaaS environment. 

The style is **Corporate / Modern** with a focus on **Minimalism**. It utilizes high-quality typography and generous whitespace to reduce cognitive load during complex billing and document workflows. The interface should feel like a high-end physical law office: quiet, orderly, and sophisticated. The emotional response is one of confidence and calm, ensuring that users—regardless of their technical proficiency—feel guided through every step of the process.

## Colors
The palette is rooted in a sophisticated "warm white" base, providing a softer, more premium feel than clinical pure white. 

- **Primary & Navigation:** Deep navy tones (`#123B63`, `#0B1F3A`) are used for core structural elements and primary actions to establish authority and reliability.
- **Premium Accent:** Muted gold (`#C9A227`) is used with extreme restraint. It is reserved for specific active states, focus indicators, or "Pro" level features to maintain its impact.
- **Neutral Foundation:** Backgrounds utilize the soft beige (`#F8F5EF`) to create depth between the main canvas and white surfaces (`#FFFFFF`). Text hierarchy is strictly maintained through charcoal and grey tones to ensure high readability.

## Typography
The system relies on **Inter** for its systematic, utilitarian, and highly legible qualities. 

- **Hierarchy:** Use bold weights and tighter letter-spacing for large headlines to command attention. 
- **Body Text:** Use `body-md` (16px) as the standard for all legal descriptions and inputs to ensure maximum accessibility for all age groups.
- **Labels:** Small caps or medium-weight labels are used for metadata and table headers to distinguish them from actionable data.
- **Color usage:** Headlines should always be `text_primary`. Secondary information and helper text should use `text_secondary`.

## Layout & Spacing
This design system employs a **Fixed-Fluid Hybrid Grid**. Content is housed within a 12-column grid system with a maximum width of 1440px for centered readability, while the sidebar remains fixed.

- **Rhythm:** A strict 8px baseline grid is used. Generous padding (`lg` and `xl`) is favored within cards and panels to prevent the UI from feeling "crowded" with data.
- **Responsive Behavior:** 
  - **Desktop:** 12 columns, 24px gutters, fixed sidebar.
  - **Tablet:** 8 columns, 16px gutters, collapsible sidebar.
  - **Mobile:** 4 columns, 16px margins, top-bar navigation pattern.
- **Vertical Spacing:** Section headers should have `xxl` (48px) spacing from the content above to clearly define the start of new information modules.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and extremely soft **Ambient Shadows**. This system avoids heavy borders or harsh shadows to maintain its "calm" persona.

- **Level 0 (Background):** Soft beige (`#F8F5EF`). Used for the main application canvas.
- **Level 1 (Panels):** White (`#FFFFFF`) with a subtle 1px border (`#E5E7EB`). This is the standard for most cards and data tables.
- **Level 2 (Modals/Popovers):** White surfaces with a soft, diffused shadow (Blur: 15px, Y: 4px, Color: #1F2933 at 6% opacity). No heavy outlines.
- **Interactive Depth:** When a card or list item is hovered, it should transition to a slightly deeper shadow rather than changing its background color, simulating a physical lift.

## Shapes
The design system utilizes **Soft** roundedness. A radius of `0.25rem` (4px) is the standard for buttons, input fields, and small UI components. 

Large containers and cards utilize `rounded-lg` (8px) to soften the overall appearance of the dashboard. This subtle rounding maintains a professional, legal-grade structure while feeling contemporary and approachable. Circular shapes are reserved exclusively for avatars and status indicators (dots).

## Components
- **Primary Buttons:** Navy background, white text. Transitions to a slightly darker navy on hover. No gradients.
- **Sidebar Navigation:** Deep Navy background (`#0B1F3A`). Active states use a gold left-border accent (2px) and a subtle ghost-white text color.
- **Status Badges:** Use a "Pill" shape with a low-opacity background of the status color (e.g., Success is light green background with dark green text).
- **Data Tables:** Clean, borderless rows. Use the `#E5E7EB` border only for horizontal separators. Headers are `label-sm` in `text_secondary`.
- **Guided Checklists:** Steps that are completed use `status_success`. The "current" step is highlighted with a gold outline or icon.
- **Input Fields:** 1px solid border (`#E5E7EB`). On focus, the border color changes to `primary_color_hex` with a very faint navy glow.
- **Tabbed Views:** Underlined style tabs. The active tab uses `primary_color_hex` for the text and a 2px bottom border in gold.