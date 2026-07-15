/**
 * SportsDataIO → CaddieIQ tournament-field mapper.
 *
 * The isolation boundary for field data: the only place in the domain layer
 * allowed to reference the SportsDataIO leaderboard wire type, via `import
 * type`. Field translation only — no validation, no persistence, and no
 * relationship resolution (reconciling `playerSlug`/tournament to internal ids
 * happens in the field importer).
 *
 * Status is *derived*, not trusted: the provider's `TournamentStatus` arrives
 * obfuscated in the current tier, so this mapper computes a real
 * {@link TournamentFieldStatus} from the boolean flags (`IsWithdrawn`,
 * `IsAlternate`, `MadeCut`) and whether the event is over.
 */

import type { SdioLeaderboardPlayer } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, parseDate, slugify } from "../shared/utils"
import { DEFAULT_FIELD_STATUS, UNKNOWN_FIELD_PLAYER_NAME } from "./constants"
import type { TournamentFieldEntry, TournamentFieldStatus } from "./types"

/** Context the field status derivation needs from the tournament envelope. */
export interface FieldMapContext {
  /** Whether the tournament has completed (enables CUT/FINISHED outcomes). */
  tournamentIsOver: boolean
}

/**
 * Derive a participation status from the source flags. Precedence matters:
 * withdrawal and alternate standing describe the *entry* and take priority over
 * any result-derived outcome; only a completed event yields CUT/FINISHED.
 */
function deriveStatus(
  raw: SdioLeaderboardPlayer,
  context: FieldMapContext,
): TournamentFieldStatus {
  if (raw.IsWithdrawn === true) return "WITHDRAWN"
  if (raw.IsAlternate === true) return "ALTERNATE"
  if (context.tournamentIsOver) {
    if (raw.MadeCut === false) return "CUT"
    return "FINISHED"
  }
  return DEFAULT_FIELD_STATUS
}

/**
 * Translate a raw SportsDataIO leaderboard row into a CaddieIQ
 * {@link TournamentFieldEntry}.
 *
 * @param raw - The provider's un-normalized leaderboard player row.
 * @param context - Tournament-level context (used for status derivation).
 */
export function mapSportsDataFieldEntry(
  raw: SdioLeaderboardPlayer,
  context: FieldMapContext,
): TournamentFieldEntry {
  const playerName = cleanString(raw.Name) ?? UNKNOWN_FIELD_PLAYER_NAME

  return {
    playerName,
    playerSlug: slugify(playerName),
    countryCode: cleanString(raw.Country),
    status: deriveStatus(raw, context),
    withdrawn: raw.IsWithdrawn === true,
    // No reliable DQ flag in this feed; disqualification stays false until a
    // source exposes it explicitly.
    disqualified: false,
    isAlternate: raw.IsAlternate === true,
    cutMade: typeof raw.MadeCut === "boolean" ? raw.MadeCut : null,
    finalPosition: cleanNumber(raw.Rank),
    earnings: cleanNumber(raw.Earnings),
    teeTime: parseDate(raw.TeeTime),
    externalRef: {
      source: "sportsdataio",
      externalId: String(raw.PlayerID),
    },
  }
}
