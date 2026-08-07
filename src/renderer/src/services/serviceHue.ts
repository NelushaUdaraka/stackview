/**
 * Per-service colour, routed through the active theme.
 *
 * `SERVICE_CONFIG[svc].hex` is the service's own hue. Rather than painting it at
 * full strength everywhere, both helpers below resolve through two theme tokens:
 *
 *   --svc            when a theme sets it (Terminal, Paper Rail), every service
 *                    collapses to one neutral colour
 *   --hue-strength   scales tints; 0 removes them entirely
 *
 * The reference strength is 0.15 — the value the default theme carries — so at
 * that setting the output matches the original hard-coded rgba() exactly.
 */

const REFERENCE_HUE_STRENGTH = 0.15

/** A translucent wash of the service hue, e.g. an icon tile or pill background. */
export function svcTint(hex: string, alpha: number): string {
  const pct = (alpha * 100).toFixed(2)
  return `color-mix(in srgb, var(--svc, ${hex}) calc(var(--hue-strength) / ${REFERENCE_HUE_STRENGTH} * ${pct}%), transparent)`
}

/** The service hue at full strength, e.g. an icon glyph or the active pill. */
export function svcSolid(hex: string): string {
  return `var(--svc, ${hex})`
}
