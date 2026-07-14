/**
 * Design token reference for CaddieIQ.
 * JavaScript-side mirror of the CSS custom properties in globals.css.
 * Use these in non-CSS contexts (e.g. ECharts config, canvas, SVG).
 */

// ─── Spacing (px) ─────────────────────────────────────────────────────────────
export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const

// ─── Border radius (rem) ──────────────────────────────────────────────────────
export const radius = {
  xs:   '0.25rem',
  sm:   '0.375rem',
  md:   '0.5rem',
  lg:   '0.625rem',
  xl:   '0.875rem',
  '2xl': '1rem',
  full: '9999px',
} as const

// ─── Typography scale ─────────────────────────────────────────────────────────
export const typescale = {
  displayXl: { size: 'clamp(2.5rem, 5vw, 4rem)',    weight: 700, tracking: '-0.04em',  lineHeight: 1.05 },
  displayLg: { size: 'clamp(2rem, 4vw, 3rem)',       weight: 700, tracking: '-0.035em', lineHeight: 1.08 },
  h1:        { size: 'clamp(1.5rem, 3vw, 2rem)',     weight: 600, tracking: '-0.028em', lineHeight: 1.15 },
  h2:        { size: 'clamp(1.25rem, 2.5vw, 1.5rem)',weight: 600, tracking: '-0.022em', lineHeight: 1.25 },
  h3:        { size: '1.125rem',                     weight: 600, tracking: '-0.016em', lineHeight: 1.35 },
  h4:        { size: '1rem',                         weight: 600, tracking: '-0.012em', lineHeight: 1.4  },
  bodyLg:    { size: '1rem',                         weight: 400, tracking: '-0.008em', lineHeight: 1.65 },
  body:      { size: '0.875rem',                     weight: 400, tracking: '-0.004em', lineHeight: 1.6  },
  small:     { size: '0.8125rem',                    weight: 400, tracking: '0',         lineHeight: 1.55 },
  caption:   { size: '0.75rem',                      weight: 400, tracking: '0.004em',  lineHeight: 1.5  },
  label:     { size: '0.75rem',                      weight: 500, tracking: '0.04em',   lineHeight: 1.4  },
  code:      { size: '0.8125rem',                    weight: 400, tracking: '-0.01em',  lineHeight: 1.6  },
} as const

// ─── Duration (ms) ────────────────────────────────────────────────────────────
export const duration = {
  instant: 80,
  fast:    140,
  normal:  200,
  slow:    300,
  slower:  400,
  page:    250,
} as const

// ─── Semantic color names (for documentation) ─────────────────────────────────
export const colorNames = [
  'background',
  'foreground',
  'card',
  'surface',
  'primary',
  'secondary',
  'muted',
  'accent',
  'success',
  'warning',
  'destructive',
  'info',
  'border',
  'ring',
  'overlay',
] as const

export type ColorName = typeof colorNames[number]

// ─── Shadow scale names ───────────────────────────────────────────────────────
export const shadowNames = [
  'subtle',
  'card',
  'dropdown',
  'modal',
  'lg',
  'hover',
] as const

export type ShadowName = typeof shadowNames[number]
