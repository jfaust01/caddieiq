/**
 * Maps form score to contextual descriptive labels
 * Helps users understand player form at a glance
 */
export function getFormDescription(formScore: number): string {
  if (formScore >= 80) {
    return 'Hot'
  }
  if (formScore >= 65) {
    return 'Heating Up'
  }
  if (formScore >= 50) {
    return 'Solid'
  }
  if (formScore >= 35) {
    return 'Cooling Off'
  }
  if (formScore >= 20) {
    return 'Cold'
  }
  return 'Slump'
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
