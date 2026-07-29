/**
 * Maps form score to contextual icon names and colors
 * Helps users understand player form at a glance
 */
export function getFormIcon(formScore: number): string {
  if (formScore >= 80) {
    return 'Flame' // Hot
  }
  if (formScore >= 65) {
    return 'TrendingUp' // Heating Up
  }
  if (formScore >= 50) {
    return 'Circle' // Solid
  }
  if (formScore >= 35) {
    return 'TrendingDown' // Cooling Off
  }
  if (formScore >= 20) {
    return 'Snowflake' // Cold
  }
  return 'SkipBack' // Slump
}

export function getFormColor(formScore: number): string {
  if (formScore >= 80) {
    return 'text-emerald-400' // Hot - green
  }
  if (formScore >= 65) {
    return 'text-lime-400' // Heating Up - light green
  }
  if (formScore >= 50) {
    return 'text-gray-400' // Solid - neutral gray
  }
  if (formScore >= 35) {
    return 'text-amber-400' // Cooling Off - amber
  }
  if (formScore >= 20) {
    return 'text-orange-400' // Cold - orange
  }
  return 'text-red-400' // Slump - red
}
