/**
 * Repository layer tests.
 *
 * These exercise persistence behavior against an in-memory fake of the Prisma
 * delegates — no real database. They verify idempotent upserts (insert then
 * update on the same slug), bulk result accounting, soft delete, and the
 * tournament relationship precondition.
 */

import { describe, expect, it } from "vitest"

import type { Player } from "@/lib/domain/player/types"
import type { Course } from "@/lib/domain/course/types"
import type { Tournament } from "@/lib/domain/tournament/types"

import { CourseRepository } from "../course-repository"
import { PlayerRepository } from "../player-repository"
import { TournamentRepository } from "../tournament-repository"
import { StatisticsRepository, type ResolvedSeasonStat } from "../statistics-repository"
import { silentRepositorySink } from "../logger"

/* ------------------------------------------------------------------ */
/* In-memory Prisma fakes                                              */
/* ------------------------------------------------------------------ */

interface Row {
  id: string
  slug: string
  deletedAt: Date | null
  [key: string]: unknown
}

/** A minimal delegate backed by a Map, matching the surface repositories use. */
function makeDelegate(seedTour = false) {
  const rows = new Map<string, Row>()
  let counter = 0
  const bySlug = () => new Map([...rows.values()].map((r) => [r.slug, r] as const))

  return {
    rows,
    async findUnique(args: { where: { slug?: string; id?: string } }) {
      if (args.where.slug !== undefined) return bySlug().get(args.where.slug) ?? null
      if (args.where.id !== undefined) return rows.get(args.where.id) ?? null
      return null
    },
    async create(args: { data: Record<string, unknown> }) {
      const id = `id_${(counter += 1)}`
      // Tournament create nests relations; flatten `tour.connect.id` to tourId.
      const data = { ...args.data }
      const tour = data.tour as { connect?: { id: string } } | undefined
      if (tour?.connect?.id) data.tourId = tour.connect.id
      delete data.tour
      delete data.season
      const row: Row = { id, deletedAt: null, ...(data as object) } as Row
      rows.set(id, row)
      return row
    },
    async update(args: { where: { slug?: string; id?: string }; data: Record<string, unknown> }) {
      const target =
        args.where.id !== undefined
          ? rows.get(args.where.id)
          : bySlug().get(args.where.slug as string)
      if (!target) throw Object.assign(new Error("not found"), { code: "P2025" })
      Object.assign(target, args.data)
      return target
    },
  }
}

/** Build a Prisma-client-shaped object exposing only the delegate under test. */
function fakePrisma(entity: "player" | "course" | "tournament", seedTour = false) {
  const delegate = makeDelegate(seedTour)
  return { prisma: { [entity]: delegate } as never, delegate }
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function player(overrides: Partial<Player> = {}): Player {
  return {
    externalRef: { source: "sportsdataio", externalId: "1" },
    firstName: "Rory",
    lastName: "McIlroy",
    fullName: "Rory McIlroy",
    slug: "rory-mcilroy",
    birthDate: null,
    heightCm: null,
    weightKg: null,
    turnedProYear: null,
    handedness: "RIGHT",
    status: "ACTIVE",
    headshotUrl: null,
    countryCode: "NIR",
    ...overrides,
  }
}

function course(overrides: Partial<Course> = {}): Course {
  return {
    externalRef: { source: "sportsdataio", externalId: "10" },
    name: "Augusta National",
    slug: "augusta-national",
    city: "Augusta",
    stateProvince: "GA",
    country: "USA",
    par: 72,
    yardage: 7475,
    ...overrides,
  }
}

function tournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    externalRef: { source: "sportsdataio", externalId: "100" },
    name: "The Masters",
    officialName: "Masters Tournament",
    slug: "the-masters",
    status: "SCHEDULED",
    format: "STROKE_PLAY",
    startDate: new Date("2025-04-10"),
    endDate: new Date("2025-04-13"),
    purse: 20_000_000,
    ...overrides,
  }
}

/* ------------------------------------------------------------------ */
/* Player                                                             */
/* ------------------------------------------------------------------ */

describe("PlayerRepository", () => {
  it("inserts on first upsert and updates on the second (idempotent by slug)", async () => {
    const { prisma, delegate } = fakePrisma("player")
    const repo = new PlayerRepository(prisma, silentRepositorySink)

    const first = await repo.upsert(player())
    expect(first.outcome).toBe("inserted")

    const second = await repo.upsert(player({ status: "INACTIVE" }))
    expect(second.outcome).toBe("updated")

    // Only one row exists despite two imports.
    expect(delegate.rows.size).toBe(1)
    expect(second.record?.status).toBe("INACTIVE")
  })

  it("bulkUpsert reports processed/inserted/updated counters", async () => {
    const { prisma } = fakePrisma("player")
    const repo = new PlayerRepository(prisma, silentRepositorySink)

    const result = await repo.bulkUpsert([
      player({ slug: "a", fullName: "A" }),
      player({ slug: "b", fullName: "B" }),
      player({ slug: "a", fullName: "A2" }), // same slug → update
    ])

    expect(result.processed).toBe(3)
    expect(result.inserted).toBe(2)
    expect(result.updated).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.records).toHaveLength(3)
  })

  it("soft-deletes an existing player and skips a missing one", async () => {
    const { prisma } = fakePrisma("player")
    const repo = new PlayerRepository(prisma, silentRepositorySink)

    const inserted = await repo.upsert(player())
    const id = inserted.record!.id

    const deleted = await repo.delete(id)
    expect(deleted.outcome).toBe("updated")
    expect(deleted.record?.deletedAt).toBeInstanceOf(Date)

    // Now soft-deleted → findById excludes it.
    expect(await repo.findById(id)).toBeNull()

    const again = await repo.delete(id)
    expect(again.outcome).toBe("skipped")
  })

  it("findByExternalId returns null (no provenance column yet)", async () => {
    const { prisma } = fakePrisma("player")
    const repo = new PlayerRepository(prisma, silentRepositorySink)
    expect(await repo.findByExternalId({ source: "sportsdataio", externalId: "1" })).toBeNull()
  })
})

/* ------------------------------------------------------------------ */
/* Course                                                             */
/* ------------------------------------------------------------------ */

describe("CourseRepository", () => {
  it("is idempotent by slug", async () => {
    const { prisma, delegate } = fakePrisma("course")
    const repo = new CourseRepository(prisma, silentRepositorySink)

    expect((await repo.upsert(course())).outcome).toBe("inserted")
    expect((await repo.upsert(course({ par: 71 }))).outcome).toBe("updated")
    expect(delegate.rows.size).toBe(1)
  })
})

/* ------------------------------------------------------------------ */
/* Tournament                                                         */
/* ------------------------------------------------------------------ */

describe("TournamentRepository", () => {
  it("fails with a RelationshipError when inserting without tourId", async () => {
    const { prisma } = fakePrisma("tournament")
    const repo = new TournamentRepository(prisma, silentRepositorySink)

    const result = await repo.upsert({ tournament: tournament() })
    expect(result.outcome).toBe("failed")
    expect(result.error?.code).toBe("RELATIONSHIP_ERROR")
  })

  it("inserts with a resolved tourId, then updates without one", async () => {
    const { prisma, delegate } = fakePrisma("tournament")
    const repo = new TournamentRepository(prisma, silentRepositorySink)

    const inserted = await repo.upsert({ tournament: tournament(), tourId: "tour_1" })
    expect(inserted.outcome).toBe("inserted")
    expect(delegate.rows.get(inserted.record!.id)?.tourId).toBe("tour_1")

    // Second import (update) does not require tourId.
    const updated = await repo.upsert({ tournament: tournament({ status: "ACTIVE" }) })
    expect(updated.outcome).toBe("updated")
    expect(delegate.rows.size).toBe(1)
  })
})

/* ------------------------------------------------------------------ */
/* Statistics — world-ranking anti-regression guard                   */
/* ------------------------------------------------------------------ */

/** Minimal fake of the season-statistics delegate (composite playerId_season). */
function fakeStatisticsPrisma() {
  const rows = new Map<string, Record<string, unknown>>()
  const keyOf = (w: { playerId_season: { playerId: string; season: number } }) =>
    `${w.playerId_season.playerId}:${w.playerId_season.season}`
  const delegate = {
    rows,
    async findUnique(args: {
      where: { playerId_season: { playerId: string; season: number } }
    }) {
      return rows.get(keyOf(args.where)) ?? null
    },
    async upsert(args: {
      where: { playerId_season: { playerId: string; season: number } }
      create: Record<string, unknown>
      update: Record<string, unknown>
    }) {
      const k = keyOf(args.where)
      const existing = rows.get(k)
      const row = existing
        ? { ...existing, ...args.update }
        : { id: `stat_${rows.size + 1}`, ...args.create }
      rows.set(k, row)
      return row
    },
  }
  return { prisma: { playerSeasonStatistic: delegate } as never, delegate }
}

function seasonStat(
  worldRanking: number | null,
  worldRankingLastWeek: number | null,
): ResolvedSeasonStat {
  return {
    playerId: "player_1",
    stat: {
      playerName: "Rory McIlroy",
      playerSlug: "rory-mcilroy",
      season: 2025,
      worldRanking,
      worldRankingLastWeek,
      events: 31,
      averagePoints: 3.7,
      totalPoints: 279.5,
      pointsGained: 0,
      pointsLost: 0,
      externalRef: { source: "sportsdataio", externalId: "40000965" },
    },
  }
}

describe("StatisticsRepository world-ranking guard", () => {
  it("does not let a null (scrambled) rank overwrite a real stored rank", async () => {
    const { prisma, delegate } = fakeStatisticsPrisma()
    const repo = new StatisticsRepository(prisma, silentRepositorySink)

    // First import lands a real rank.
    const first = await repo.upsert(seasonStat(2, 3))
    expect(first.outcome).toBe("inserted")

    // A later scrambled import (rank mapped to null) must PRESERVE the real rank.
    const second = await repo.upsert(seasonStat(null, null))
    expect(second.outcome).toBe("updated")
    const stored = delegate.rows.get("player_1:2025")
    expect(stored?.worldRanking).toBe(2)
    expect(stored?.worldRankingLastWeek).toBe(3)
    // Non-ranking fields still update normally.
    expect(stored?.events).toBe(31)
  })

  it("updates the rank when a real value arrives", async () => {
    const { prisma, delegate } = fakeStatisticsPrisma()
    const repo = new StatisticsRepository(prisma, silentRepositorySink)

    await repo.upsert(seasonStat(50, 55))
    await repo.upsert(seasonStat(48, 50))
    const stored = delegate.rows.get("player_1:2025")
    expect(stored?.worldRanking).toBe(48)
    expect(stored?.worldRankingLastWeek).toBe(50)
  })
})
