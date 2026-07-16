import { describe, expect, it } from "vitest"

import { buildPlatformInventory, INVENTORY_TABLES } from "../inventory"

/**
 * A count map that gives every known table one row — the "fully populated"
 * baseline. Individual tests override specific tables to exercise the empty and
 * obsolete branches.
 */
function allPopulated(): Record<string, number> {
  return Object.fromEntries(INVENTORY_TABLES.map((t) => [t, 1]))
}

describe("buildPlatformInventory", () => {
  it("classifies every registry table exactly once", () => {
    const { entries, summary } = buildPlatformInventory({})
    expect(entries).toHaveLength(INVENTORY_TABLES.length)
    expect(summary.total).toBe(INVENTORY_TABLES.length)
    // No duplicate tables.
    expect(new Set(entries.map((e) => e.table)).size).toBe(INVENTORY_TABLES.length)
  })

  it("bucket counts always sum to the total", () => {
    const { summary } = buildPlatformInventory(allPopulated())
    const sum =
      summary.healthy +
      summary.waiting +
      summary.future +
      summary.providerLimited +
      summary.obsolete +
      summary.broken
    expect(sum).toBe(summary.total)
  })

  it("treats a table absent from the count map as zero rows (never populated)", () => {
    const { entries } = buildPlatformInventory({})
    // Nothing may be reported healthy when no counts are supplied.
    expect(entries.every((e) => e.health !== "healthy" || e.rowCount > 0)).toBe(true)
    expect(entries.some((e) => e.rowCount === 0)).toBe(true)
  })

  it("reports a populated table as healthy with a row-count reason", () => {
    const counts = { ...allPopulated(), players: 977 }
    const players = buildPlatformInventory(counts).entries.find((e) => e.table === "players")
    expect(players?.health).toBe("healthy")
    expect(players?.rowCount).toBe(977)
    expect(players?.reason).toContain("977")
  })

  it("flags an empty import_runs as broken (the audit trail should never be empty)", () => {
    const counts = { ...allPopulated(), import_runs: 0 }
    const runs = buildPlatformInventory(counts).entries.find((e) => e.table === "import_runs")
    expect(runs?.health).toBe("broken")
    expect(runs?.reason).toMatch(/no import has run/i)
  })

  it("classifies empty future-sprint tables as future, not broken", () => {
    const counts = { ...allPopulated(), rounds: 0, player_rounds: 0, round_statistics: 0 }
    const inv = buildPlatformInventory(counts)
    for (const table of ["rounds", "player_rounds", "round_statistics"]) {
      expect(inv.entries.find((e) => e.table === table)?.health).toBe("future")
    }
  })

  it("preserves the registry order in both entries and INVENTORY_TABLES", () => {
    const entries = buildPlatformInventory(allPopulated()).entries
    expect(entries.map((e) => e.table)).toEqual([...INVENTORY_TABLES])
  })

  it("gives every entry a non-empty purpose, population method, and reason", () => {
    for (const entry of buildPlatformInventory(allPopulated()).entries) {
      expect(entry.purpose.length).toBeGreaterThan(0)
      expect(entry.populationMethod.length).toBeGreaterThan(0)
      expect(entry.reason.length).toBeGreaterThan(0)
    }
  })

  it("singularizes the row-count reason for exactly one row", () => {
    const counts = { ...allPopulated(), users: 1 }
    const users = buildPlatformInventory(counts).entries.find((e) => e.table === "users")
    expect(users?.reason).toContain("1 row present")
    expect(users?.reason).not.toContain("1 rows")
  })
})
