/**
 * RoundStatistic domain types.
 *
 * RoundStatistic represents detailed round-level performance metrics for a player
 * in a specific round. It links 1:1 with PlayerRound and is populated from
 * SportsDataIO leaderboard scorecard data.
 */

/** Detailed performance statistics for a player's round. */
export interface RoundStatistic {
  /** CaddieIQ-generated unique id. */
  id: string
  /** Resolved player_round id (FK) — exactly one statistic per player round. */
  playerRoundId: string
  /** Driving distance in yards (e.g., 289.5). Leave NULL if not available. */
  drivingDistance: number | null
  /** Driving accuracy as a percentage (0-100). Leave NULL if not available. */
  drivingAccuracy: number | null
  /** Number of fairways hit. Leave NULL if not available. */
  fairwaysHit: number | null
  /** Number of fairway opportunities. Leave NULL if not available. */
  fairwaysPossible: number | null
  /** Number of greens hit in regulation. Leave NULL if not available. */
  greensInRegulation: number | null
  /** Number of GIR opportunities (hole attempts). Leave NULL if not available. */
  greensPossible: number | null
  /** Total putts for the round. Leave NULL if not available. */
  putts: number | null
  /** Number of birdies (including eagle/albatross counts). */
  birdies: number | null
  /** Number of eagles. */
  eagles: number | null
  /** Number of pars. */
  pars: number | null
  /** Number of bogeys. */
  bogeys: number | null
  /** Number of double bogeys. */
  doubleBogeys: number | null
  /** Scrambling percentage (recovery rate, 0-100). Leave NULL if not available. */
  scramblingPercentage: number | null
  /** Sand save percentage (0-100). Leave NULL if not available. */
  sandSavePercentage: number | null
  /** Average proximity to hole (feet). Leave NULL if not available. */
  proximityToHole: number | null
  /** Strokes gained off the tee. Leave NULL if not available. */
  sgOffTheTee: number | null
  /** Strokes gained approach. Leave NULL if not available. */
  sgApproach: number | null
  /** Strokes gained around the green. Leave NULL if not available. */
  sgAroundGreen: number | null
  /** Strokes gained putting. Leave NULL if not available. */
  sgPutting: number | null
  /** Total strokes gained. Leave NULL if not available. */
  sgTotal: number | null
  /** Timestamp of creation. */
  createdAt: Date
  /** Timestamp of last update. */
  updatedAt: Date
}
