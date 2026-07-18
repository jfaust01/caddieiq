/**
 * RoundStatistic mapper.
 *
 * Map SportsDataIO round scorecard data (Players[].Rounds[]) into CaddieIQ
 * RoundStatistic domain objects. RoundStatistic stores detailed round-level
 * performance metrics including stroke counts (birdies, bogeys, etc.) and
 * links to the corresponding PlayerRound.
 */

import type { SdioRound } from "@/lib/providers/sportsdataio/types"
import type { RoundStatistic } from "./types"

/**
 * Map a SportsDataIO round scorecard into a RoundStatistic domain object.
 *
 * Extracts all available statistics from the round data and persists them.
 * Fields not present in the SportsDataIO response are left NULL to avoid
 * fabricating data.
 *
 * @param playerRoundId — Resolved CaddieIQ player_round id (FK)
 * @param round — The round scorecard data from SportsDataIO leaderboard
 * @returns A RoundStatistic domain object ready for persistence
 */
export function mapSportsDataRoundStatistic(
  playerRoundId: string,
  round: SdioRound | undefined,
): RoundStatistic {
  if (!round) {
    // If no round data provided, create a minimal record with nulls
    return {
      id: "", // Will be set by repository
      playerRoundId,
      drivingDistance: null,
      drivingAccuracy: null,
      fairwaysHit: null,
      fairwaysPossible: null,
      greensInRegulation: null,
      greensPossible: null,
      putts: null,
      birdies: null,
      eagles: null,
      pars: null,
      bogeys: null,
      doubleBogeys: null,
      scramblingPercentage: null,
      sandSavePercentage: null,
      proximityToHole: null,
      sgOffTheTee: null,
      sgApproach: null,
      sgAroundGreen: null,
      sgPutting: null,
      sgTotal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return {
    id: "", // Will be set by repository
    playerRoundId,
    // Direct mappings from SdioRound — TASK 3 implementation
    drivingDistance: null, // SportsDataIO does not provide this; would require higher tier or alternative source
    drivingAccuracy: null,
    fairwaysHit: null,
    fairwaysPossible: null,
    greensInRegulation: null,
    greensPossible: null,
    putts: null,
    birdies: round.Birdies ?? null,
    eagles: round.Eagles ?? null,
    pars: round.Pars ?? null,
    bogeys: round.Bogeys ?? null,
    doubleBogeys: round.DoubleBogeys ?? null,
    scramblingPercentage: null, // Requires calculation from Holes[] data; not provided directly
    sandSavePercentage: null, // Requires calculation from Holes[] data
    proximityToHole: null, // SportsDataIO does not provide this metric
    sgOffTheTee: null, // Strokes Gained metrics require PGA Tour data source
    sgApproach: null,
    sgAroundGreen: null,
    sgPutting: null,
    sgTotal: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
