/**
 * Normalize tournament status for display in dropdown options.
 * 
 * Maps database status values to user-friendly labels:
 * - SCHEDULED, UPCOMING → "Upcoming"
 * - ACTIVE, IN_PROGRESS, LIVE → "Live"
 * - COMPLETED → "Completed"
 * - CANCELLED, CANCELED → "Cancelled"
 * - POSTPONED → "Postponed"
 */
export function normalizeTournamentStatus(status: string | null | undefined): string {
  if (!status) return "Unknown"

  const normalized = status.trim().toUpperCase()

  switch (normalized) {
    case "SCHEDULED":
    case "UPCOMING":
      return "Upcoming"
    case "ACTIVE":
    case "IN_PROGRESS":
    case "LIVE":
      return "Live"
    case "COMPLETED":
      return "Completed"
    case "CANCELLED":
    case "CANCELED":
      return "Cancelled"
    case "POSTPONED":
      return "Postponed"
    default:
      return status
  }
}

/**
 * Get display tone/style for a normalized tournament status.
 * Returns semantic styling class prefix for use with Badge or styled components.
 */
export function getTournamentStatusTone(
  normalizedStatus: string
): "default" | "success" | "muted" | "destructive" | "warning" {
  switch (normalizedStatus) {
    case "Live":
      return "success"
    case "Upcoming":
      return "default"
    case "Completed":
      return "muted"
    case "Cancelled":
      return "destructive"
    case "Postponed":
      return "warning"
    default:
      return "default"
  }
}
