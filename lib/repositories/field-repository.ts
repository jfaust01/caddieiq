/**
 * Tournament field repository.
 *
 * The only layer permitted to persist tournament fields (the roster of players
 * entered in / competing at an event, stored in `tournament_fields`). It
 * accepts already-validated {@link TournamentFieldEntry} domain objects whose
 * `tournamentId`/`playerId` have already been resolved to CaddieIQ ids by the
 * field linker — it never maps, validates, or fetches.
 *
 * Idempotency: reconciliation is keyed by the composite unique
 * `(tournamentId, playerId)`, so re-importing a field updates each entry in
 * place (e.g. a withdrawal or a finish position) rather than duplicating it.
 * This differs from the slug-keyed repositories, so it upserts directly rather
 * than via `upsertBySlug`.
 */

import type { TournamentFieldEntry } from "@/lib/domain/field/types"
import { Prisma } from "@/lib/generated/prisma/client"
import type {
  TournamentField as TournamentFieldRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import {
  fail,
  ok,
  type BulkRepositoryResult,
  type RepositoryResult,
} from "./repository-result"

/**
 * A validated field entry whose reconciliation keys have already been resolved
 * to CaddieIQ ids by the field importer. The domain {@link TournamentFieldEntry}
 * intentionally carries no ids (it emits slugs + provenance only); resolving
 * those to a real `Tournament.id`/`Player.id` is a persistence-time concern, so
 * the linker pairs each entry with its resolved ids before calling the
 * repository. This keeps the "entries only ever link to players that already
 * exist" invariant enforced upstream of any write.
 */
export interface ResolvedFieldEntry {
  tournamentId: string
  playerId: string
  entry: TournamentFieldEntry
}

/** One entrant in a tournament field, flattened for UI rendering. */
export interface FieldEntryRow {
  id: string
  playerId: string
  playerName: string
  countryCode: string | null
  /** Remote headshot URL when available; null renders an initials placeholder. */
  headshotUrl: string | null
  /** Active professional tour membership. */
  tour: string | null
  status: string
  isAlternate: boolean
  withdrawn: boolean
  cutMade: boolean | null
  /**
   * The player's most recent season World Golf Ranking, or null when no season
   * statistics have been imported for them. Sourced from the live season-stats
   * import — never fabricated. Treated as indicative given the provider tier's
   * known rank obfuscation.
   */
  worldRanking: number | null
  /**
   * Tournament finishing position (1, 2, 3, etc.), or null when not yet set.
   * Sourced from tournament_fields.finalPosition (authoritative result).
   */
  position: number | null
  /**
   * Total tournament strokes, or null when no historical outcome exists.
   * Sourced from historical_tournament_outcomes.total_strokes (authoritative result).
   */
  totalStrokes: number | null
  /**
   * Total tournament score relative to par, or null when unavailable.
   * Sourced from historical_tournament_outcomes.score_to_par (authoritative result).
   */
  totalRelativeToPar: number | null
  /**
   * The player's final DraftKings fantasy points for this tournament, or null
   * when no historical tournament outcome exists. Only populated when
   * HistoricalTournamentOutcome records are available. Never estimates,
   * projections, or averages — only authoritative DK results.
   */
  dkFantasyPoints: number | null
  /**
   * Per-round DraftKings fantasy points, stored as a JSONB object with round numbers as keys
   * (e.g., {"1": 38, "2": 28, "3": 23, "4": 27}), or null when unavailable.
   * Sourced from hole-by-hole scoring (birdies, eagles, bogeys) plus scoring efficiency bonuses.
   */
  roundDkPoints: Record<string, number> | null
  /**
   * DraftKings fantasy point projection for this tournament, or null when unavailable.
   * Sourced from fantasy_projections.fantasyPointsDraftKings (not actual scoring).
   */
  projection: number | null
  /**
   * American odds to win the tournament, formatted as string (e.g., "+1200", "-500"),
   * or null when no odds are available.
   * Sourced from odds_quotes.americanOdds for the tournament's odds event.
   */
  odds: string | null
  /**
   * Projected DFS ownership percentage (0-100), or null when unavailable.
   * Not currently sourced (schema does not identify ownership data).
   */
  ownershipPercent: number | null
  /**
   * DraftKings salary for this tournament, or null when no DFS salary record exists.
   * Sourced from dfs_salaries.salary for the player and tournament.
   */
  dfsSalary: number | null
  // Per-round scoring data
  round1: number | null
  round1RelToPar: number | null
  round2: number | null
  round2RelToPar: number | null
  round3: number | null
  round3RelToPar: number | null
  round4: number | null
  round4RelToPar: number | null
}

/** Compact entrant used for the tournament hub's field preview. */
export interface FieldPreviewRow {
  playerId: string
  playerName: string
  countryCode: string | null
  status: string
}

export class FieldRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "field", sink)
  }

  /**
   * Idempotently persist one resolved field entry, reconciled on the composite
   * `(tournamentId, playerId)` key.
   */
  async upsert(resolved: ResolvedFieldEntry): Promise<RepositoryResult<TournamentFieldRecord>> {
    const { tournamentId, playerId, entry } = resolved
    const reference = `${tournamentId}:${playerId}`
    const data = {
      status: entry.status,
      isAlternate: entry.isAlternate,
      withdrawn: entry.withdrawn,
      disqualified: entry.disqualified,
      cutMade: entry.cutMade,
      finalPosition: entry.finalPosition,
      teeTime: entry.teeTime,
      earnings: entry.earnings == null ? null : new Prisma.Decimal(entry.earnings),
    }
    try {
      const existing = await this.prisma.tournamentField.findUnique({
        where: { tournamentId_playerId: { tournamentId, playerId } },
      })
      const record = await this.prisma.tournamentField.upsert({
        where: { tournamentId_playerId: { tournamentId, playerId } },
        create: { tournamentId, playerId, ...data },
        update: data,
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "tournamentField",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<TournamentFieldRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved field entries. Never throws per item. */
  async bulkUpsert(
    entries: readonly ResolvedFieldEntry[],
  ): Promise<BulkRepositoryResult<TournamentFieldRecord>> {
    return this.runBulk(
      entries,
      (e) => `${e.tournamentId}:${e.playerId}`,
      (e) => this.upsert(e),
    )
  }

  /** Count the field size for a tournament (all entries, alternates included). */
  async countByTournament(tournamentId: string): Promise<number> {
    return this.prisma.tournamentField.count({ where: { tournamentId } })
  }

  /**
   * A small preview of a tournament's field for the hub, ordered alphabetically
   * by player name.
   *
   * Ordering is by name — NOT by finishing position — on purpose: the current
   * SportsDataIO tier obfuscates rank/result fields, so any "leaderboard"
   * ordering would be fabricated. An alphabetical roster is the honest,
   * stable presentation.
   */
  async previewByTournament(tournamentId: string, limit = 6): Promise<FieldPreviewRow[]> {
    return this.prisma.$queryRaw<FieldPreviewRow[]>(Prisma.sql`
      SELECT
        p.id AS "playerId",
        p."fullName" AS "playerName",
        COALESCE(p."countryCode", n.iso2) AS "countryCode",
        tf.status::text AS "status"
      FROM tournament_fields tf
      JOIN players p ON p.id = tf."playerId" AND p."deletedAt" IS NULL
      LEFT JOIN nationalities n ON n.id = p."nationalityId" AND n."deletedAt" IS NULL
      WHERE tf."tournamentId" = ${tournamentId}
      ORDER BY p."fullName" ASC
      LIMIT ${limit}
    `)
  }

  /**
   * The full field for a tournament, flattened with player identity for the
   * Field tab, ordered alphabetically by player name.
   *
   * As with {@link previewByTournament}, the ordering intentionally avoids
   * finishing position because the provider tier obfuscates it. Callers get a
   * clean roster and can re-sort client-side on the reliable dimensions (name,
   * participation status). Read-only.
   */
  async listByTournament(tournamentId: string): Promise<FieldEntryRow[]> {
    return this.prisma.$queryRaw<FieldEntryRow[]>(Prisma.sql`
      SELECT
        tf.id AS "id",
        p.id AS "playerId",
        p."fullName" AS "playerName",
        COALESCE(p."countryCode", n.iso2) AS "countryCode",
        p."headshotUrl" AS "headshotUrl",
        ds.operator AS "tour",
        tf.status::text AS "status",
        tf."isAlternate" AS "isAlternate",
        tf.withdrawn AS "withdrawn",
        tf."cutMade" AS "cutMade",
        tf."finalPosition" AS "position",
        stat."worldRanking" AS "worldRanking",
        hto.dk_fantasy_points AS "dkFantasyPoints",
        hto.round_dk_points_json AS "roundDkPoints",
        hto.total_strokes AS "totalStrokes",
        hto.score_to_par AS "totalRelativeToPar",
        fp."fantasyPointsDraftKings"::float AS "projection",
        -- Odds: fetch the most recent American odds for this player in this tournament
        oq."americanOdds"::text AS "odds",
        -- Ownership percentage (null - not available in current schema)
        NULL::float AS "ownershipPercent",
        ds.salary AS "dfsSalary",
        -- Per-round strokes and relative-to-par
        MAX(CASE WHEN r."roundNumber" = 1 THEN pr.score END) AS "round1",
        MAX(CASE WHEN r."roundNumber" = 1 THEN pr."toPar" END) AS "round1RelToPar",
        MAX(CASE WHEN r."roundNumber" = 2 THEN pr.score END) AS "round2",
        MAX(CASE WHEN r."roundNumber" = 2 THEN pr."toPar" END) AS "round2RelToPar",
        MAX(CASE WHEN r."roundNumber" = 3 THEN pr.score END) AS "round3",
        MAX(CASE WHEN r."roundNumber" = 3 THEN pr."toPar" END) AS "round3RelToPar",
        MAX(CASE WHEN r."roundNumber" = 4 THEN pr.score END) AS "round4",
        MAX(CASE WHEN r."roundNumber" = 4 THEN pr."toPar" END) AS "round4RelToPar"
      FROM tournament_fields tf
      JOIN players p ON p.id = tf."playerId" AND p."deletedAt" IS NULL
      -- Nationality lookup for ISO 2-letter country code fallback
      LEFT JOIN nationalities n ON n.id = p."nationalityId" AND n."deletedAt" IS NULL
      -- DFS salaries: source of authoritative tour operator
      -- LEFT JOIN (optional) allows entrants without DFS salary records (no tour data)
      LEFT JOIN dfs_salaries ds
        ON ds."playerId" = tf."playerId"
        AND ds."tournamentId" = tf."tournamentId"
      -- Per-round scoring data
      LEFT JOIN player_rounds pr ON pr."tournamentFieldId" = tf.id
      LEFT JOIN rounds r ON r.id = pr."roundId"
      -- The player's most recent season ranking, if any has been imported.
      -- LEFT JOIN LATERAL keeps entrants without stats in the roster (rank null).
      LEFT JOIN LATERAL (
        SELECT s."worldRanking"
        FROM player_season_statistics s
        WHERE s."playerId" = p.id
        ORDER BY s.season DESC
        LIMIT 1
      ) stat ON true
      -- Historical tournament outcomes (total strokes, scoring, DK points).
      -- LEFT JOIN allows entrants without outcomes (no historical data).
      LEFT JOIN historical_tournament_outcomes hto
        ON hto.tournament_id = tf."tournamentId"
        AND hto.player_id = tf."playerId"
      -- Fantasy projections (DraftKings projections for this tournament).
      -- LEFT JOIN allows entrants without projections (not yet generated).
      LEFT JOIN fantasy_projections fp
        ON fp."playerId" = tf."playerId"
        AND fp."tournamentId" = tf."tournamentId"
      -- Odds: fetch the most recent odds quote for this player/tournament
      -- Deduplicates by taking the latest odds_event per player (by event updatedAt)
      LEFT JOIN LATERAL (
        SELECT oq."americanOdds"
        FROM odds_quotes oq
        JOIN odds_events oe ON oe.id = oq."oddsEventId"
        WHERE oe."tournamentId" = tf."tournamentId"
          AND oq."playerId" = p.id
          AND oq.market = 'TOURNAMENT_WINNER'
        ORDER BY oe."updatedAt" DESC
        LIMIT 1
      ) oq ON true
      WHERE tf."tournamentId" = ${tournamentId}
      GROUP BY tf.id, p.id, p."fullName", p."countryCode", n.iso2, p."headshotUrl", ds.operator, tf.status, 
               tf."isAlternate", tf.withdrawn, tf."cutMade", tf."finalPosition", stat."worldRanking", 
               hto.dk_fantasy_points, hto.round_dk_points_json, hto.total_strokes, hto.score_to_par, fp."fantasyPointsDraftKings",
               ds.salary, oq."americanOdds"
      ORDER BY p."fullName" ASC
    `)
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _fieldRepository: FieldRepository | undefined
export function getFieldRepository(): FieldRepository {
  return (_fieldRepository ??= new FieldRepository())
}
