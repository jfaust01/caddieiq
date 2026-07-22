/**
 * Single source of truth for DFS data quality metrics.
 * Used by Data Quality panel, DFS tab warning, summaries, and provenance details.
 */
export interface DfsDataQuality {
  /** Total count of tournament field entries */
  fieldEntryCount: number

  /** Total count of stored DFS salary records in database */
  salaryRecordCount: number

  /** Field entries matched to DFS salary records */
  matchedPlayerCount: number

  /** Field entries without DFS salary match */
  unmatchedPlayerCount: number

  /** Details of players without matched DFS salaries */
  unmatchedPlayers: Array<{
    playerId: string
    playerName: string
  }>

  /** Count of duplicate DFS records (same player, same tournament) */
  duplicateRecordCount: number

  /** Rows rendered in DFS table (matchedPlayerCount) */
  renderedRowCount: number

  /** Overall data quality classification */
  status: 'VERIFIED' | 'PARTIAL' | 'UNAVAILABLE'

  /** Explanation of status */
  statusReason: string

  /** ISO timestamp of last database query */
  queriedAt: string
}

/**
 * Build DFS data quality from tournament and DFS data.
 * This is the single point of calculation.
 */
export function buildDfsDataQuality(
  fieldEntryCount: number,
  dfsSalaryRecords: Array<{ playerId: string }>,
  unmatchedPlayers: Array<{ playerId: string; playerName: string }>,
  queriedAt: string
): DfsDataQuality {
  const salaryRecordCount = dfsSalaryRecords.length
  const matchedPlayerCount = fieldEntryCount - unmatchedPlayers.length
  const unmatchedPlayerCount = unmatchedPlayers.length

  // Check for duplicates: if distinct players < total records
  const distinctDfsPlayers = new Set(dfsSalaryRecords.map(r => r.playerId)).size
  const duplicateRecordCount = salaryRecordCount - distinctDfsPlayers

  // Determine status
  let status: DfsDataQuality['status']
  let statusReason: string

  if (salaryRecordCount === 0) {
    status = 'UNAVAILABLE'
    statusReason = 'No DFS salary records stored in database'
  } else if (unmatchedPlayerCount > 0) {
    status = 'PARTIAL'
    statusReason = `${matchedPlayerCount} of ${fieldEntryCount} field entrants matched to DFS salaries`
  } else if (duplicateRecordCount > 0) {
    status = 'PARTIAL'
    statusReason = `${duplicateRecordCount} duplicate DFS records detected`
  } else {
    status = 'VERIFIED'
    statusReason = `All ${fieldEntryCount} field entrants matched to DFS salaries`
  }

  return {
    fieldEntryCount,
    salaryRecordCount,
    matchedPlayerCount,
    unmatchedPlayerCount,
    unmatchedPlayers,
    duplicateRecordCount,
    renderedRowCount: matchedPlayerCount,
    status,
    statusReason,
    queriedAt,
  }
}
