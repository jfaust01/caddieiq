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
 *
 * When roundData is provided (from Players[].Rounds[]), uses the actual round score
 * and calculates toPar. When roundData is null (aggregate tournament data), falls
 * back to player-level fields for position and cut status.
 *
 * @param roundId — Resolved CaddieIQ round id
 * @param tournamentFieldId — Resolved CaddieIQ tournament field entry id
 * @param player — The player row from the leaderboard
 * @param roundData — Optional: specific round's scorecard data (Players[].Rounds[i])
 * @returns A PlayerRound domain object
 */
export function mapSportsDataPlayerRound(
  roundId: string,
  tournamentFieldId: string,
  player: SdioLeaderboardPlayer | undefined,
  roundData?: typeof import("@/lib/providers/sportsdataio/types").SdioRound | undefined,
): PlayerRound {
  // TASK 2: Use actual round score from scorecard if available, otherwise null
  // The score represents total strokes for the round.
  let score: number | null = null
  let toPar: number | null = null

  if (roundData?.Score !== undefined && roundData.Score !== null) {
    score = roundData.Score
    // Calculate toPar if both score and par are available
    if (roundData.Par !== undefined && roundData.Par !== null) {
      toPar = roundData.Score - roundData.Par
    }
  }

  // Rank is the player's finishing position (1 = winner) — use from player level
  // This represents the player's final tournament position, which applies to all rounds
  const position = player?.Rank ?? null

  // madeCut indicates whether the player made the cut (null before/at cut time)
  // Note: SportsDataIO may return this as float (1.0, 1.1) instead of boolean,
  // so we coerce to boolean explicitly before passing to Prisma
  const rawMadeCut = player?.MadeCut
  const madeCut = rawMadeCut === undefined || rawMadeCut === null ? null : !!rawMadeCut

  // withdrawn indicates withdrawal
  const withdrawn = player?.IsWithdrawn ?? false

  // Use round-specific tee time if available, otherwise fall back to tournament start time
  let teeTime: Date | null = null
  if (roundData?.TeeTime) {
    teeTime = new Date(roundData.TeeTime)
  } else if (player?.TeeTime) {
    teeTime = new Date(player.TeeTime)
  }

  return {
    id: "", // Will be set by repository
    roundId,
    tournamentFieldId,
    score, // Now: actual strokes (e.g., 68, 70, 87), previously was Rank
    toPar, // Now: calculated score-minus-par (e.g., -2, 0, +16), previously was always null
    position,
    madeCut,
    withdrawn,
    disqualified: false, // SportsDataIO does not expose disqualification
    teeTime,
    startedAt: null, // Provider does not expose actual start time
    finishedAt: null, // Provider does not expose actual finish time
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
