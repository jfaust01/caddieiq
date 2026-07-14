/**
 * Small, dependency-free helpers for the Model Lab client state.
 */

/** Generate a short, unique-enough id for in-memory client entities. */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36).slice(-4)
  return `${prefix}-${time}${random}`
}

/** Format an ISO timestamp as a compact relative-ish label. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Signed integer label, e.g. "+4" / "−2" / "0". */
export function signed(value: number): string {
  if (value > 0) return `+${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return '0'
}
