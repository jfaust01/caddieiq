/**
 * Import pipeline tests.
 *
 * These exercise the manager end-to-end with fake collaborators (a fake
 * provider returning raw SportsDataIO records, and fake repositories), using
 * the real mappers and the real data-quality validator — so the test proves the
 * pipeline orchestrates the actual layers without re-implementing them. No
 * network and no database are touched.
 */

import { describe, expect, it } from "vitest"

import type { GolfDataProvider, ProviderListResponse } from "@/lib/providers/provider"
import type { SdioCourse, SdioPlayer } from "@/lib/providers/sportsdataio/types"
import type { Course, Player } from "@/lib/domain"
import type { BulkRepositoryResult } from "@/lib/repositories"
import type { PlayerRepository } from "@/lib/repositories"
import type { CourseRepository } from "@/lib/repositories"

import { ImportManager } from "../import-manager"
import { createPlayerImportDefinition } from "../player-import"
import { createCourseImportDefinition } from "../course-import"
import { silentImportSink } from "../import-logger"

// --- Fakes -----------------------------------------------------------------

function listResponse<T>(data: T[], resource: string): ProviderListResponse<T> {
  return {
    data,
    meta: { provider: "sportsdataio", resource, fetchedAt: new Date() },
  }
}

/** A provider stub that returns preloaded raw records (or throws on fetch). */
function fakeProvider(config: {
  players?: SdioPlayer[]
  courses?: SdioCourse[]
  failPlayers?: Error
}): GolfDataProvider<SdioPlayer, unknown, SdioCourse> {
  return {
    providerName: "sportsdataio",
    version: "test",
    async health() {
      return {
        providerName: "sportsdataio",
        version: "test",
        connected: true,
        authenticated: true,
        latency: 1,
        status: "operational",
        checkedAt: new Date(),
      }
    },
    async listPlayers() {
      if (config.failPlayers) throw config.failPlayers
      return listResponse(config.players ?? [], "players")
    },
    async getPlayer() {
      throw new Error("not used")
    },
    async listTournaments() {
      return listResponse([], "tournaments")
    },
    async getTournament() {
      throw new Error("not used")
    },
    async listCourses() {
      return listResponse(config.courses ?? [], "courses")
    },
    async getLeaderboard() {
      // Field import is exercised separately; the manager pipeline tests do not
      // touch the leaderboard capability.
      throw new Error("not used")
    },
  }
}

/** A repository stub whose bulkUpsert reports every valid item as inserted. */
function fakePlayerRepo(): PlayerRepository {
  return {
    async bulkUpsert(players: readonly Player[]): Promise<BulkRepositoryResult<unknown>> {
      return {
        processed: players.length,
        inserted: players.length,
        updated: 0,
        skipped: 0,
        failed: 0,
        records: players.map((p) => ({ slug: p.slug })),
        errors: [],
      }
    },
  } as unknown as PlayerRepository
}

function fakeCourseRepo(captured: Course[]): CourseRepository {
  return {
    async bulkUpsert(courses: readonly Course[]): Promise<BulkRepositoryResult<unknown>> {
      captured.push(...courses)
      return {
        processed: courses.length,
        inserted: courses.length,
        updated: 0,
        skipped: 0,
        failed: 0,
        records: [],
        errors: [],
      }
    },
  } as unknown as CourseRepository
}

const manager = new ImportManager({ sink: silentImportSink })

// --- Tests -----------------------------------------------------------------

describe("ImportManager – player pipeline", () => {
  it("runs provider → mapper → quality → repository and reports success", async () => {
    const provider = fakeProvider({
      players: [
        { PlayerID: 1, FirstName: "Rory", LastName: "McIlroy", Country: "IE" },
        { PlayerID: 2, FirstName: "Scottie", LastName: "Scheffler", Country: "US" },
      ] as SdioPlayer[],
    })

    const result = await manager.run(
      createPlayerImportDefinition({ provider, repository: fakePlayerRepo() }),
      "sportsdataio",
    )

    expect(result.provider).toBe("sportsdataio")
    expect(result.entity).toBe("player")
    expect(result.processed).toBe(2)
    expect(result.inserted).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(result.qualityScoreAverage).toBeGreaterThan(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.finishedAt.getTime()).toBeGreaterThanOrEqual(result.startedAt.getTime())
  })

  it("skips entities the data-quality layer rejects (no valid name)", async () => {
    const provider = fakeProvider({
      // Missing names → mapper produces the UNKNOWN placeholder → validator rejects.
      players: [{ PlayerID: 3, Country: "US" }] as SdioPlayer[],
    })

    const result = await manager.run(
      createPlayerImportDefinition({ provider, repository: fakePlayerRepo() }),
      "sportsdataio",
    )

    expect(result.processed).toBe(1)
    expect(result.inserted).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].stage).toBe("validate")
  })

  it("captures a provider fetch failure into the report without throwing", async () => {
    const provider = fakeProvider({ failPlayers: new Error("upstream 503") })

    const result = await manager.run(
      createPlayerImportDefinition({ provider, repository: fakePlayerRepo() }),
      "sportsdataio",
    )

    expect(result.processed).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].stage).toBe("fetch")
    expect(result.errors[0].message).toContain("upstream 503")
  })
})

describe("ImportManager – course pipeline", () => {
  it("maps the venue as the course and persists it", async () => {
    const captured: Course[] = []
    const provider = fakeProvider({
      courses: [
        { TournamentID: 10, Name: "The Masters", Venue: "Augusta National", Par: 72 },
      ] as SdioCourse[],
    })

    const result = await manager.run(
      createCourseImportDefinition({ provider, repository: fakeCourseRepo(captured) }),
      "sportsdataio",
    )

    expect(result.entity).toBe("course")
    expect(result.processed).toBe(1)
    expect(result.inserted).toBe(1)
    expect(captured[0].name).toBe("Augusta National")
    expect(captured[0].slug).toBe("augusta-national")
  })

  it("collapses the tournament-shaped feed to distinct venues before mapping", async () => {
    const captured: Course[] = []
    // The feed repeats a venue once per edition; a sparse row is completed by a
    // richer sibling for the same venue.
    const provider = fakeProvider({
      courses: [
        { TournamentID: 1, Name: "Masters 2023", Venue: "Augusta National" },
        { TournamentID: 2, Name: "Masters 2024", Venue: "Augusta National", Par: 72 },
        { TournamentID: 3, Name: "U.S. Open 2024", Venue: "Pinehurst No. 2", Par: 70 },
      ] as SdioCourse[],
    })

    const result = await manager.run(
      createCourseImportDefinition({ provider, repository: fakeCourseRepo(captured) }),
      "sportsdataio",
    )

    // Two distinct venues, not three feed rows.
    expect(result.processed).toBe(2)
    expect(captured).toHaveLength(2)
    const augusta = captured.find((c) => c.slug === "augusta-national")
    expect(augusta?.par).toBe(72) // back-filled from the richer sibling row
  })
})
