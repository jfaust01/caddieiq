/**
 * Player Skill repository.
 *
 * The ONLY layer permitted to read the raw skill source (`RoundStatistic` rows,
 * joined up through `PlayerRound → TournamentField → Player` for player id and
 * `PlayerRound → Round` for the played date/season). It returns validated,
 * engine-shaped domain objects (`PlayerSkillSamples` + `SkillPopulation`) and
 * performs no normalization, ranking, or fabrication — that is the pure engine's
 * job. When the source table is empty (e.g. strokes-gained not entitled on the
 * current provider tier) every read returns empty, and the engine renders an
 * honest Unknown profile downstream.
 */
import "server-only"

import prismaClient from "@/lib/prisma"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import {
  SOURCEABLE_SKILL_KEYS,
  type PlayerSkillSamples,
  type SkillKey,
  type SkillPopulation,
  type SkillRoundSample,
} from "@/lib/player-skill-intelligence"

import { BaseRepository } from "./base-repository"
import type { RepositoryLogSink } from "./logger"

/** Platform-wide skill coverage, for the admin data-coverage dashboard. */
export interface PlayerSkillCoverageCounts {
  /** Distinct players with at least one round statistic row. */
  playersWithSamples: number
  /** Total round-statistic rows held. */
  roundStatistics: number
  /** Round-statistic rows carrying at least one strokes-gained value. */
  roundsWithStrokesGained: number
  /** Distinct seasons represented. */
  seasons: number
  /** Newest sampled round timestamp, or null. */
  latestRoundAt: Date | null
}

/**
 * The Prisma row shape we select for a skill sample. Kept narrow so the query
 * only pulls the raw statistic columns the engine actually consumes.
 */
interface RawStatRow {
  playerId: string
  playedAt: Date | null
  season: number | null
  sgOffTheTee: number | null
  sgApproach: number | null
  sgAroundGreen: number | null
  sgPutting: number | null
  sgTotal: number | null
  drivingDistance: number | null
  drivingAccuracy: number | null
  fairwaysHit: number | null
  fairwaysPossible: number | null
  greensInRegulation: number | null
  greensPossible: number | null
  putts: number | null
  birdies: number | null
  eagles: number | null
  pars: number | null
  bogeys: number | null
  doubleBogeys: number | null
  scramblingPercentage: number | null
  sandSavePercentage: number | null
}

export class PlayerSkillRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "player-skill", sink)
  }

  /**
   * All round-statistic samples for one player, newest first. Season is taken
   * from the round's scheduled date (falling back to null). Returns an empty
   * `rounds` array when the player has no samples — the engine turns that into
   * an honest Unknown profile.
   */
  async findSamplesByPlayerId(playerId: string): Promise<PlayerSkillSamples> {
    const rows = await this.selectStatRows({ playerId })
    const rounds = rows.map(toRoundSample)
    return {
      playerId,
      season: latestSeason(rounds),
      rounds,
    }
  }

  /**
   * Samples for many players at once (a tournament field), returned as a map of
   * playerId → samples. Players with no rows are simply absent from the map.
   */
  async findSamplesByPlayerIds(
    playerIds: readonly string[],
  ): Promise<Map<string, PlayerSkillSamples>> {
    const out = new Map<string, PlayerSkillSamples>()
    if (playerIds.length === 0) return out

    const rows = await this.selectStatRows({ playerId: { in: [...playerIds] } })
    const byPlayer = new Map<string, SkillRoundSample[]>()
    for (const row of rows) {
      const list = byPlayer.get(row.playerId)
      if (list) list.push(toRoundSample(row))
      else byPlayer.set(row.playerId, [toRoundSample(row)])
    }
    for (const [pid, rounds] of byPlayer) {
      out.set(pid, { playerId: pid, season: latestSeason(rounds), rounds })
    }
    return out
  }

  /**
   * Build the field-relative normalization population from a set of players'
   * samples: for each sourceable skill, the sorted-ascending array of each
   * player's mean raw value for that skill. Skills nobody has data for are
   * absent (⇒ unrankable, reported Unknown by the engine).
   */
  buildPopulation(samplesByPlayer: Iterable<PlayerSkillSamples>): SkillPopulation {
    const perSkill = new Map<SkillKey, number[]>()
    for (const samples of samplesByPlayer) {
      for (const key of SOURCEABLE_SKILL_KEYS) {
        const mean = meanForSkill(samples.rounds, key)
        if (mean === null) continue
        const list = perSkill.get(key)
        if (list) list.push(mean)
        else perSkill.set(key, [mean])
      }
    }
    const population: SkillPopulation = {}
    for (const [key, values] of perSkill) {
      population[key] = values.sort((a, b) => a - b)
    }
    return population
  }

  /**
   * The platform-wide normalization population in one pass: every held sample,
   * grouped by player, reduced to the per-skill sorted distribution. Shared by
   * both the player profile and the field leaderboards so percentiles are
   * stable across the app. Empty when no samples exist.
   */
  async loadPlatformPopulation(): Promise<SkillPopulation> {
    const rows = await this.selectStatRows({})
    const byPlayer = new Map<string, SkillRoundSample[]>()
    for (const row of rows) {
      const sample = toRoundSample(row)
      const list = byPlayer.get(row.playerId)
      if (list) list.push(sample)
      else byPlayer.set(row.playerId, [sample])
    }
    const samples: PlayerSkillSamples[] = [...byPlayer.entries()].map(([playerId, rounds]) => ({
      playerId,
      season: latestSeason(rounds),
      rounds,
    }))
    return this.buildPopulation(samples)
  }

  /** Platform-wide skill coverage counters for the admin dashboard. */
  async getCoverageCounts(): Promise<PlayerSkillCoverageCounts> {
    const [roundStatistics, sgRows, rows] = await Promise.all([
      this.prisma.roundStatistic.count(),
      this.prisma.roundStatistic.count({
        where: {
          OR: [
            { sgTotal: { not: null } },
            { sgOffTheTee: { not: null } },
            { sgApproach: { not: null } },
            { sgAroundGreen: { not: null } },
            { sgPutting: { not: null } },
          ],
        },
      }),
      this.selectStatRows({}),
    ])

    const players = new Set<string>()
    const seasons = new Set<number>()
    let latest: Date | null = null
    for (const row of rows) {
      players.add(row.playerId)
      if (row.season !== null) seasons.add(row.season)
      if (row.playedAt && (!latest || row.playedAt > latest)) latest = row.playedAt
    }

    return {
      playersWithSamples: players.size,
      roundStatistics,
      roundsWithStrokesGained: sgRows,
      seasons: seasons.size,
      latestRoundAt: latest,
    }
  }

  /**
   * Shared projection: join RoundStatistic up to the player id and round date.
   * `where` filters on the (aliased) player id via the relation.
   */
  private async selectStatRows(playerFilter: {
    playerId?: string | { in: string[] }
  }): Promise<RawStatRow[]> {
    const where =
      playerFilter.playerId === undefined
        ? {}
        : {
            playerRound: {
              tournamentField: { playerId: playerFilter.playerId },
            },
          }

    const records = await this.prisma.roundStatistic.findMany({
      where,
      select: {
        drivingDistance: true,
        drivingAccuracy: true,
        fairwaysHit: true,
        fairwaysPossible: true,
        greensInRegulation: true,
        greensPossible: true,
        putts: true,
        birdies: true,
        eagles: true,
        pars: true,
        bogeys: true,
        doubleBogeys: true,
        scramblingPercentage: true,
        sandSavePercentage: true,
        sgOffTheTee: true,
        sgApproach: true,
        sgAroundGreen: true,
        sgPutting: true,
        sgTotal: true,
        playerRound: {
          select: {
            round: { select: { scheduledDate: true } },
            tournamentField: { select: { playerId: true } },
          },
        },
      },
    })

    return records.map((r) => ({
      playerId: r.playerRound.tournamentField.playerId,
      playedAt: r.playerRound.round.scheduledDate,
      season: seasonOf(r.playerRound.round.scheduledDate),
      sgOffTheTee: r.sgOffTheTee,
      sgApproach: r.sgApproach,
      sgAroundGreen: r.sgAroundGreen,
      sgPutting: r.sgPutting,
      sgTotal: r.sgTotal,
      drivingDistance: r.drivingDistance,
      drivingAccuracy: r.drivingAccuracy,
      fairwaysHit: r.fairwaysHit,
      fairwaysPossible: r.fairwaysPossible,
      greensInRegulation: r.greensInRegulation,
      greensPossible: r.greensPossible,
      putts: r.putts,
      birdies: r.birdies,
      eagles: r.eagles,
      pars: r.pars,
      bogeys: r.bogeys,
      doubleBogeys: r.doubleBogeys,
      scramblingPercentage: r.scramblingPercentage,
      sandSavePercentage: r.sandSavePercentage,
    }))
  }
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                       */
/* ------------------------------------------------------------------ */

function toRoundSample(row: RawStatRow): SkillRoundSample {
  return {
    playedAt: row.playedAt ? row.playedAt.toISOString() : null,
    season: row.season,
    sgOffTheTee: row.sgOffTheTee,
    sgApproach: row.sgApproach,
    sgAroundGreen: row.sgAroundGreen,
    sgPutting: row.sgPutting,
    sgTotal: row.sgTotal,
    drivingDistance: row.drivingDistance,
    drivingAccuracy: row.drivingAccuracy,
    fairwaysHit: row.fairwaysHit,
    fairwaysPossible: row.fairwaysPossible,
    greensInRegulation: row.greensInRegulation,
    greensPossible: row.greensPossible,
    putts: row.putts,
    birdies: row.birdies,
    eagles: row.eagles,
    pars: row.pars,
    bogeys: row.bogeys,
    doubleBogeys: row.doubleBogeys,
    scramblingPercentage: row.scramblingPercentage,
    sandSavePercentage: row.sandSavePercentage,
  }
}

function seasonOf(date: Date | null): number | null {
  return date ? date.getUTCFullYear() : null
}

function latestSeason(rounds: readonly SkillRoundSample[]): number | null {
  let best: number | null = null
  for (const r of rounds) {
    if (r.season !== null && (best === null || r.season > best)) best = r.season
  }
  return best
}

/**
 * The per-player mean raw value for a skill, mirroring the engine's own
 * aggregation so the population and the player's rating are on the same scale.
 * Percentage/derived skills that have no direct column resolve to null.
 */
function meanForSkill(rounds: readonly SkillRoundSample[], key: SkillKey): number | null {
  const values: number[] = []
  for (const r of rounds) {
    const v = rawValueForSkill(r, key)
    if (v !== null && Number.isFinite(v)) values.push(v)
  }
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Map one round sample to a skill's native raw value (or null if absent). */
function rawValueForSkill(r: SkillRoundSample, key: SkillKey): number | null {
  switch (key) {
    case "sgOffTheTee":
      return r.sgOffTheTee
    case "sgApproach":
      return r.sgApproach
    case "sgAroundGreen":
      return r.sgAroundGreen
    case "sgPutting":
      return r.sgPutting
    case "drivingDistance":
      return r.drivingDistance
    case "drivingAccuracy":
      return r.drivingAccuracy
    case "greensInRegulation":
      return r.greensPossible && r.greensInRegulation !== null
        ? (r.greensInRegulation / r.greensPossible) * 100
        : r.greensInRegulation
    case "scrambling":
      return r.scramblingPercentage
    case "sandSave":
      return r.sandSavePercentage
    default:
      // Derived / no-source skills are not part of the population; the engine
      // computes or Unknown-flags them itself.
      return null
  }
}

let singleton: PlayerSkillRepository | null = null

/** Shared singleton, matching the other repositories' access pattern. */
export function getPlayerSkillRepository(): PlayerSkillRepository {
  if (!singleton) singleton = new PlayerSkillRepository()
  return singleton
}
