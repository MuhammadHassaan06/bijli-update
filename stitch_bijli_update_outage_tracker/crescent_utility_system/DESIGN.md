---
name: Crescent Utility System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#404a3b'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#707a6a'
  outline-variant: '#bfcab7'
  surface-tint: '#106e09'
  primary: '#004b00'
  on-primary: '#ffffff'
  primary-container: '#006600'
  on-primary-container: '#88e274'
  inverse-primary: '#81db6e'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed023'
  on-secondary-container: '#6f5900'
  tertiary: '#86000d'
  on-tertiary: '#ffffff'
  tertiary-container: '#af0f1a'
  on-tertiary-container: '#ffbdb7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf987'
  primary-fixed-dim: '#81db6e'
  on-primary-fixed: '#002200'
  on-primary-fixed-variant: '#005300'
  secondary-fixed: '#ffe084'
  secondary-fixed-dim: '#eec209'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#930010'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
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
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 20px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is built on the intersection of institutional reliability and modern agility. It targets a broad demographic—from urban professionals to rural users—requiring a UI that feels "Official" yet operates with the speed of a contemporary SaaS product. 

The aesthetic follows a **Modern Corporate** approach with a **Minimalist** finish. It prioritizes clarity and high signal-to-noise ratios, ensuring that critical information like power status, billing, and scheduled outages are never obscured by decorative elements. The patriotic sentiment is expressed through a disciplined use of the national palette and subtle geometric motifs rather than literal imagery, evoking a sense of national pride through high-quality service design.

## Colors
The palette is rooted in the national identity of Pakistan. 

- **Primary (Flag Green):** Used for primary actions, headers, and active states. It represents the "Go" state and brand authority.
- **Secondary (Crescent Gold):** A functional accent used sparingly for "Premium" features or highlighting specific alerts that require attention but aren't emergencies.
- **Tertiary (Outage Red):** Reserved strictly for critical alerts, power outages, and overdue payments.
- **Neutral (State White/Grey):** The background is kept exceptionally clean to allow the green and red indicators to pop. Surface levels are defined by slight shifts in off-white to maintain a soft, accessible contrast.

## Typography
This design system utilizes **Inter** for its exceptional legibility across low-resolution mobile displays. The type scale is generous, prioritizing high contrast between headers and body text to facilitate rapid scanning of utility data. 

To ensure the "Government Utility" feel is maintained, text is primarily left-aligned with a strict vertical rhythm. All numeric data (units consumed, bill amounts) should use tabular lining to ensure numbers align perfectly in lists and tables.

## Layout & Spacing
The layout employs a **Fluid Grid** for mobile devices with a standard 4-column structure, transitioning to a 12-column fixed grid (max-width: 1200px) for desktop. 

- **Touch Targets:** Minimum 48px height for all interactive elements to accommodate all users.
- **Information Density:** Use wide margins (20px) on mobile to prevent the UI from feeling cluttered.
- **Rhythm:** An 8px baseline grid is used to define all heights and vertical spacing, ensuring a consistent and rhythmic flow as the user scrolls through data-heavy pages.

## Elevation & Depth
To maintain a modern and professional feel, the design system uses **Tonal Layers** rather than heavy shadows. 

- **Level 0 (Background):** #F8F9FA.
- **Level 1 (Cards):** #FFFFFF with a 1px solid border in #E9ECEF.
- **Level 2 (Active/Floating):** Use a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to indicate interactivity or modal overlays.
- **Depth Cues:** Depth is primarily communicated through color-filled containers. For example, a green header bar sits at the highest conceptual level, pinning its importance.

## Shapes
The design system adopts **Soft** roundedness. This 4px (0.25rem) corner radius provides a professional, stable feel that mimics official government identification and formal documents, while avoiding the aggressive sharpness of 0px corners.

Large containers and cards use `rounded-lg` (8px) to soften the overall appearance of the dashboard.

## Components
- **Buttons:** Primary buttons are solid Green (#006600) with White text. Use bold weight for labels. Secondary buttons use a Green outline with a White background.
- **Status Cards:** The core of the experience. Cards use a thick 4px left-border accent to denote status (Green for "Online," Red for "Outage," Gold for "Scheduled").
- **Input Fields:** Use a structured box style with a subtle grey border. When focused, the border transitions to a 2px Green stroke. Labels should always be visible above the input field.
- **Chips:** Used for quick filtering of regions or feeders. These are pill-shaped with a light grey background, turning Green when selected.
- **Status Indicators:** Use a simple circular dot next to text labels (e.g., • System Active).
- **Iconography:** Use line-icons with a consistent 2px stroke weight. Incorporate a subtle crescent-and-star motif in the empty state illustrations or as a watermark in header backgrounds to reinforce the patriotic theme.
- **Progress Bars:** Used for billing cycles or load shedding durations. The track is light grey, and the fill is Green (or Red if the limit is exceeded).