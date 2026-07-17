/**
 * Round and PlayerRound mappers.
 *
 * Map SportsDataIO leaderboard responses into CaddieIQ Round and PlayerRound
 * domain objects. Since the leaderboard contains only tournament-aggregate
 * player scores (no round-by-round breakdown), we create one Round per
 * tournament representing the full event.
 */

import type {
  SdioLeaderboard,
  SdioLeaderboardPlayer,
  SdioTournament,
} from "@/lib/providers/sportsdataio/types"
import type { PlayerRound, Round } from "./types"

/**
 * Map a SportsDataIO tournament (from leaderboard) into a Round domain object.
 * Creates a single aggregate round for the entire tournament, with `roundNumber=1`
 * since the provider does not expose per-round data.
 *
 * @param tournamentId — Resolved CaddieIQ tournament id
 * @param tournament — The tournament envelope from the leaderboard
 * @returns A Round domain object
 */
export function mapSportsDataRound(
  tournamentId: string,
  tournament: SdioTournament | undefined,
): Round {
  const startDate = tournament?.StartDate ? new Date(tournament.StartDate) : null

  return {
    id: "", // Will be set by repository
    tournamentId,
    roundNumber: 1, // Aggregate round for the entire tournament
    scheduledDate: startDate,
    status: "COMPLETED", // Historical imports are always completed
    completed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Map a SportsDataIO leaderboard player into a PlayerRound domain object.
 * Extracted tournament-level scores become the round score. Position is derived
 * from Rank; madeCut from MadeCut; withdrawn from IsWithdrawn.
 *
 * @param roundId — Resolved CaddieIQ round id
 * @param tournamentFieldId — Resolved CaddieIQ tournament field entry id
 * @param player — The player row from the leaderboard
 * @returns A PlayerRound domain object
 */
export function mapSportsDataPlayerRound(
  roundId: string,
  tournamentFieldId: string,
  player: SdioLeaderboardPlayer | undefined,
): PlayerRound {
  // Extract score from player row. Score is typically serialized as the
  // cumulative tournament score (e.g. -10 for 10 under par).
  // SportsDataIO does not provide a "Score" field directly in leaderboard,
  // so we derive it from the player's aggregate result if available.
  // For now, score is left null until provider data confirms otherwise.
  const score = null // Provider limitation: no per-round or tournament score field

  // Rank is the player's finishing position (1 = winner)
  const position = player?.Rank ?? null

  // madeCut indicates whether the player made the cut (null before/at cut time)
  const madeCut = player?.MadeCut ?? null

  // withdrawn indicates withdrawal
  const withdrawn = player?.IsWithdrawn ?? false

  return {
    id: "", // Will be set by repository
    roundId,
    tournamentFieldId,
    score,
    toPar: null, // Provider does not expose strokes-to-par at field level
    position,
    madeCut,
    withdrawn,
    disqualified: false, // SportsDataIO does not expose disqualification
    teeTime: player?.TeeTime ? new Date(player.TeeTime) : null,
    startedAt: null, // Provider does not expose actual start time
    finishedAt: null, // Provider does not expose actual finish time
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
