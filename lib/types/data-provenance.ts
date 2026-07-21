/**
 * CADDIEIQ DATA PROVENANCE SYSTEM
 * 
 * Every displayed metric must support complete traceability:
 * - Source (API, database, calculated, AI, estimated)
 * - Status (real, dummy, stale, unavailable)
 * - Timestamp (retrieved, updated, calculated)
 * - Confidence level
 * - Verification state
 */

export type DataStatus = 
  | 'REAL_API'
  | 'REAL_DATABASE'
  | 'CALCULATED'
  | 'AI_INTERPRETATION'
  | 'ESTIMATED'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'DUMMY'
  | 'MOCK'
  | 'SEEDED'
  | 'FALLBACK'
  | 'PLACEHOLDER'
  | 'ERROR'

export type SourceType = 'api' | 'database' | 'calculation' | 'ai' | 'manual' | 'mock'

export interface DataProvenance {
  /** The displayed or computed value */
  value: unknown
  
  /** Status classification */
  status: DataStatus
  
  /** Human-readable source name (e.g., "SportsDataIO", "PostgreSQL tournaments table") */
  sourceName: string
  
  /** Type of source */
  sourceType: SourceType
  
  /** Database table name or API endpoint */
  sourceLocation?: string
  
  /** Database record ID or API response ID */
  sourceRecordId?: string
  
  /** API endpoint URL (without credentials) */
  sourceEndpoint?: string
  
  /** When was this value retrieved from the source? */
  retrievedAt?: Date
  
  /** When was this value last updated at the source? */
  lastUpdatedAt?: Date
  
  /** When was this calculated value computed? */
  calculatedAt?: Date
  
  /** Mathematical formula for calculated values */
  formula?: string
  
  /** Input field names used in calculation */
  inputFields?: string[]
  
  /** Confidence level 0-1 */
  confidence?: number
  
  /** Has this value been independently verified? */
  isVerified: boolean
  
  /** Verification notes */
  verificationNotes?: string
  
  /** Original unformatted value */
  rawValue?: unknown
  
  /** Why was a fallback value used? */
  fallbackReason?: string
  
  /** Error message if status is ERROR */
  errorMessage?: string
}

/**
 * Badge styling based on status
 */
export const DATA_STATUS_CONFIG: Record<DataStatus, {
  label: string
  color: 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'gray'
  icon: string
}> = {
  REAL_API: { label: 'Real', color: 'green', icon: '✓' },
  REAL_DATABASE: { label: 'Real', color: 'green', icon: '✓' },
  CALCULATED: { label: 'Calculated', color: 'blue', icon: '∑' },
  AI_INTERPRETATION: { label: 'AI Analysis', color: 'purple', icon: '⚡' },
  ESTIMATED: { label: 'Estimated', color: 'amber', icon: '~' },
  STALE: { label: 'Stale', color: 'amber', icon: '⏱' },
  UNAVAILABLE: { label: 'Unavailable', color: 'gray', icon: '—' },
  DUMMY: { label: 'Dummy Data', color: 'red', icon: '!' },
  MOCK: { label: 'Mock Data', color: 'red', icon: '!' },
  SEEDED: { label: 'Test Data', color: 'red', icon: '!' },
  FALLBACK: { label: 'Fallback', color: 'red', icon: '!' },
  PLACEHOLDER: { label: 'Placeholder', color: 'red', icon: '!' },
  ERROR: { label: 'Error', color: 'red', icon: 'X' },
}

/**
 * Freshness thresholds by data type
 */
export const FRESHNESS_THRESHOLDS: Record<string, number> = {
  // milliseconds
  WEATHER: 60 * 60 * 1000, // 60 minutes
  ODDS: 15 * 60 * 1000, // 15 minutes
  TOURNAMENT_METADATA: 24 * 60 * 60 * 1000, // 24 hours
  PLAYER_STATS: 24 * 60 * 60 * 1000, // 24 hours
  HISTORICAL_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
}

/**
 * Check if data is fresh
 */
export function isFresh(lastUpdated: Date | undefined, threshold: number): boolean {
  if (!lastUpdated) return false
  return Date.now() - lastUpdated.getTime() < threshold
}

/**
 * Get freshness status text
 */
export function getFreshnessText(lastUpdated: Date | undefined, threshold: number): string {
  if (!lastUpdated) return 'Never synced'
  
  const age = Date.now() - lastUpdated.getTime()
  const isFreshData = age < threshold
  
  const minutes = Math.floor(age / (60 * 1000))
  const hours = Math.floor(age / (60 * 60 * 1000))
  const days = Math.floor(age / (24 * 60 * 60 * 1000))
  
  let ageText: string
  if (minutes < 1) ageText = 'just now'
  else if (minutes < 60) ageText = `${minutes}m ago`
  else if (hours < 24) ageText = `${hours}h ago`
  else ageText = `${days}d ago`
  
  return isFreshData ? `Updated ${ageText}` : `Stale — last updated ${ageText}`
}
