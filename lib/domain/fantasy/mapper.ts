import type {
  SdioDfsSlate,
  SdioDfsSlatePlayer,
  SdioPlayerTournamentProjection,
} from "@/lib/providers/sportsdataio/types"

import { cleanUnscrambledString, isImplausibleProjection } from "@/lib/domain/shared"
import { cleanNumber, slugify } from "@/lib/domain/shared/utils"

import type { DomainDfsSalary, DomainFantasyProjection } from "./types"

/**
 * Plausible inclusive range for a single-tournament fantasy point projection.
 * Real per-event golf projections sit in the low tens; the trial tier scrambles
 * them into implausible values (per the catalog), which fall outside this band
 * and are treated as unavailable rather than persisted as fake numbers.
 */
const PROJECTION_RANGE = { min: 0, max: 200 } as const

/** Clean a projection number, returning null when absent or implausible. */
function cleanProjection(value: number | undefined): number | null {
  const n = cleanNumber(value)
  if (n === null) return null
  return isImplausibleProjection(n, PROJECTION_RANGE) ? null : n
}

/**
 * Map a raw player tournament projection. `available` is true only when at
 * least one projection value survived the plausibility gate; otherwise both
 * point fields are null so no scrambled number is ever surfaced.
 */
export function mapSportsDataProjection(
  raw: SdioPlayerTournamentProjection,
): DomainFantasyProjection {
  const dk = cleanProjection(raw.FantasyPointsDraftKings)
  const fd = cleanProjection(raw.FantasyPointsFanDuel)
  const name = cleanUnscrambledString(raw.Name)
  const tournamentExternalId =
    typeof raw.TournamentID === "number" ? raw.TournamentID : null

  return {
    externalId: `${tournamentExternalId ?? "na"}:${raw.PlayerID}`,
    tournamentExternalId,
    playerExternalId: raw.PlayerID,
    playerSlug: name ? slugify(name) : null,
    fantasyPointsDraftKings: dk,
    fantasyPointsFanDuel: fd,
    available: dk !== null || fd !== null,
  }
}

/**
 * Flatten a raw DFS slate into per-player salary rows. Salaries are real when an
 * event is slated, so there is no scramble gate — a missing salary is simply
 * null. Skips slate players without an operator player id (nothing to key on).
 */
export function mapSportsDataDfsSlate(raw: SdioDfsSlate): DomainDfsSalary[] {
  const operator = cleanUnscrambledString(raw.OperatorName ?? raw.Operator) ?? "Unknown"
  const slateId = raw.SlateID != null ? String(raw.SlateID) : null
  const tournamentExternalId =
    typeof raw.TournamentID === "number" ? raw.TournamentID : null

  const rows: DomainDfsSalary[] = []
  for (const player of raw.DfsSlatePlayers ?? []) {
    const key = dfsPlayerKey(player, slateId)
    if (!key) continue
    const name = cleanUnscrambledString(player.OperatorPlayerName)
    rows.push({
      externalId: key,
      tournamentExternalId,
      playerExternalId:
        typeof player.PlayerID === "number" && player.PlayerID > 0 ? player.PlayerID : null,
      playerSlug: name ? slugify(name) : null,
      operator,
      slateId,
      operatorPlayerName: name,
      salary: cleanNumber(player.OperatorSalary),
    })
  }
  return rows
}

/** Composite `slateId:operatorPlayerId` key, or null when unkeyable. */
function dfsPlayerKey(player: SdioDfsSlatePlayer, slateId: string | null): string | null {
  const operatorPlayerId =
    player.OperatorPlayerID ?? (player.SlatePlayerID != null ? String(player.SlatePlayerID) : null)
  if (!operatorPlayerId) return null
  return `${slateId ?? "na"}:${operatorPlayerId}`
}
