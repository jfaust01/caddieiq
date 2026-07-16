/**
 * Domain model for fantasy projections (SportsDataIO PlayerTournamentProjection)
 * and DFS salaries (SportsDataIO DfsSlates).
 *
 * Projections carry scrambled numeric VALUES on the trial tier, so a
 * `DomainFantasyProjection` has an `available` flag: when false the point fields
 * are null. DFS salaries are REAL when an event is slated, so
 * `DomainDfsSalary` has no gate — an absent salary is honest absence.
 */

/** A per-tournament fantasy projection for one player. */
export interface DomainFantasyProjection {
  /** Composite `tournamentExternalId:playerExternalId` idempotency key. */
  externalId: string
  tournamentExternalId: number | null
  playerExternalId: number
  /** Deterministic slug from the player name for resolution. */
  playerSlug: string | null
  /** Projected DraftKings points; null when scrambled/implausible. */
  fantasyPointsDraftKings: number | null
  /** Projected FanDuel points; null when scrambled/implausible. */
  fantasyPointsFanDuel: number | null
  /** True only when at least one projection value survived the scramble gate. */
  available: boolean
}

/** A DFS operator salary for one player on a slate. */
export interface DomainDfsSalary {
  /** Composite `slateId:operatorPlayerId` idempotency key. */
  externalId: string
  tournamentExternalId: number | null
  playerExternalId: number | null
  playerSlug: string | null
  /** DFS operator, e.g. "DraftKings". */
  operator: string
  slateId: string | null
  operatorPlayerName: string | null
  /** Salary in whole dollars, or null when the operator did not price them. */
  salary: number | null
}
