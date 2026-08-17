/**
 * Runtime helpers for the parts of the design that can't be expressed as a
 * static class — colors that depend on data (a resource's state, a service's
 * hue) and the alpha ramps the design applies to them.
 *
 * Everything here resolves through the theme's CSS custom properties, so a
 * theme swap carries these along with the rest of the UI.
 */

/** A theme token, as `rgb(var(--x))`. */
export const token = (name: string) => `rgb(var(--${name}))`

/** A theme token at partial opacity, as `rgb(var(--x) / a)`. */
export const alpha = (name: string, a: number) => `rgb(var(--${name}) / ${a})`

/**
 * The four states a resource can be in. The design maps `warn` onto the accent
 * rather than giving it a colour of its own, which keeps the palette to three
 * signal colours plus a neutral.
 */
export type ResourceState = 'ok' | 'warn' | 'bad' | 'idle'

export const STATE_COLOR: Record<ResourceState, string> = {
  ok: token('ok'),
  warn: token('accent'),
  bad: token('danger'),
  idle: token('hair'),
}

const OK_WORDS =
  /^(active|ok|open|allow|enabled|available|green|complete|completed|succeeded|success|running|issued|verified|in-use|inuse|compliant|recording|operational|confirmed|awscurrent|healthy|create_complete|update_complete|import_complete|delete_complete)$/

const BAD_WORDS =
  /^(failed|error|alarm|deny|disabled|inactive|expired|red|timedout|timed_out|aborted|non_compliant|noncompliant|delete_failed|create_failed|update_failed|rollback_complete|rollback_failed|unhealthy|closed|terminated|revoked)$/

const WARN_WORDS =
  /^(pending|pending_validation|pending_deletion|creating|updating|modifying|deleting|in_progress|update_in_progress|create_in_progress|delete_in_progress|queued|yellow|insufficient_data|awsprevious|stopping|starting|rebooting|snapshotting|processing)$/

/**
 * Classify an AWS status string. Falls back to secondary text so an unknown
 * status still renders legibly instead of being mis-signalled as an error.
 */
export function stateOf(value: string | null | undefined): ResourceState | null {
  if (!value) return null
  const s = value.toLowerCase().replace(/[\s-]+/g, '_')
  if (OK_WORDS.test(s)) return 'ok'
  if (BAD_WORDS.test(s)) return 'bad'
  if (WARN_WORDS.test(s)) return 'warn'
  return null
}

/** Colour for an AWS status string, or secondary text when it isn't recognised. */
export function statusColor(value: string | null | undefined): string {
  const state = stateOf(value)
  return state ? STATE_COLOR[state] : token('text-2')
}

/** The badge class matching a status string. */
export function statusBadgeClass(value: string | null | undefined): string {
  switch (stateOf(value)) {
    case 'ok': return 'badge-ok'
    case 'bad': return 'badge-danger'
    case 'warn': return 'badge-warn'
    default: return 'badge-gray'
  }
}

/** A service's own hue at partial opacity — used for icon tiles and rail marks. */
export function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** Byte counts, rendered the way the design's tables show them. */
export function formatBytes(n: number | undefined | null): string {
  if (n == null) return '—'
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}
