import { describe, expect, it, vi } from "vitest"

import type { ImportResult } from "../import-result"
import {
  deriveStatus,
  messageOf,
  normalizeImportResult,
  recordImportRun,
  type RunOutcome,
  type RunSink,
} from "../run-recorder"
import type { ImportRunInput } from "@/lib/repositories/import-run-repository"

/** A sink that captures every recorded row for assertions. */
function captureSink(): { sink: RunSink; rows: ImportRunInput[] } {
  const rows: ImportRunInput[] = []
  return {
    rows,
    sink: {
      record: async (input) => {
        rows.push(input)
        return input
      },
    },
  }
}

describe("deriveStatus", () => {
  it("is SUCCESS when nothing failed", () => {
    expect(deriveStatus({ inserted: 10, updated: 5, failed: 0 })).toBe("SUCCESS")
  })

  it("is SUCCESS on an empty (zero-row) run that did not fail", () => {
    expect(deriveStatus({})).toBe("SUCCESS")
  })

  it("is PARTIAL when failures coexist with successes", () => {
    expect(deriveStatus({ inserted: 3, failed: 2 })).toBe("PARTIAL")
    expect(deriveStatus({ updated: 1, failed: 9 })).toBe("PARTIAL")
  })

  it("is FAILURE when there are failures and nothing succeeded", () => {
    expect(deriveStatus({ inserted: 0, updated: 0, failed: 4 })).toBe("FAILURE")
  })

  it("honors an explicitly forced status over the derived one", () => {
    // A knowingly-degraded feed (trial-tier scramble) forces PARTIAL even though
    // no per-row failure occurred.
    expect(deriveStatus({ inserted: 0, updated: 12, failed: 0, status: "PARTIAL" })).toBe("PARTIAL")
    expect(deriveStatus({ failed: 5, status: "SUCCESS" })).toBe("SUCCESS")
  })
})

describe("messageOf", () => {
  it("reads the message from an Error", () => {
    expect(messageOf(new Error("boom"))).toBe("boom")
  })

  it("stringifies non-Error throws", () => {
    expect(messageOf("just a string")).toBe("just a string")
    expect(messageOf(42)).toBe("42")
  })

  it("bounds very long messages", () => {
    const long = "x".repeat(5000)
    const out = messageOf(new Error(long))
    expect(out.length).toBeLessThanOrEqual(1001)
    expect(out.endsWith("…")).toBe(true)
  })
})

describe("normalizeImportResult", () => {
  it("maps the uniform ImportResult onto the common counters", () => {
    const result: ImportResult = {
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 100,
      provider: "sportsdataio",
      entity: "player",
      processed: 20,
      mapped: 19,
      validated: 18,
      inserted: 12,
      updated: 6,
      skipped: 2,
      failed: 0,
      warnings: 1,
      errors: [],
      qualityScoreAverage: 92,
    }
    const outcome = normalizeImportResult(result)
    expect(outcome.processed).toBe(20)
    expect(outcome.inserted).toBe(12)
    expect(outcome.updated).toBe(6)
    expect(outcome.skipped).toBe(2)
    expect(outcome.failed).toBe(0)
    expect(outcome.warnings).toBe(1)
    expect(outcome.summary).toContain("quality 92/100")
    expect(outcome.error).toBeNull()
  })

  it("surfaces the first error message when present", () => {
    const result = {
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 1,
      provider: "sportsdataio",
      entity: "player",
      processed: 1,
      mapped: 0,
      validated: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 1,
      warnings: 0,
      errors: [{ message: "bad row" }],
      qualityScoreAverage: 0,
    } as unknown as ImportResult
    expect(normalizeImportResult(result).error).toBe("bad row")
  })
})

describe("recordImportRun", () => {
  it("records exactly one row and returns the original result on success", async () => {
    const { sink, rows } = captureSink()
    const result = await recordImportRun({
      provider: "sportsdataio",
      entity: "statistics",
      sink,
      run: async () => ({ n: 7 }),
      normalize: (r): RunOutcome => ({ inserted: r.n, summary: `${r.n} rows` }),
    })
    expect(result).toEqual({ n: 7 })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      provider: "sportsdataio",
      entity: "statistics",
      status: "SUCCESS",
      inserted: 7,
      summary: "7 rows",
    })
    expect(rows[0].durationMs).toBeGreaterThanOrEqual(0)
  })

  it("records a FAILURE row AND rethrows when the work throws", async () => {
    const { sink, rows } = captureSink()
    await expect(
      recordImportRun({
        provider: "the-odds-api",
        entity: "odds",
        sink,
        run: async () => {
          throw new Error("provider 500")
        },
        normalize: () => ({}),
      }),
    ).rejects.toThrow("provider 500")
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      entity: "odds",
      status: "FAILURE",
      error: "provider 500",
      summary: "Run threw before completing.",
    })
  })

  it("propagates a forced PARTIAL status for a knowingly-degraded feed", async () => {
    const { sink, rows } = captureSink()
    await recordImportRun({
      provider: "sportsdataio",
      entity: "betting",
      sink,
      run: async () => ({}),
      normalize: (): RunOutcome => ({ updated: 10, failed: 0, status: "PARTIAL" }),
    })
    expect(rows[0].status).toBe("PARTIAL")
  })

  it("never lets a sink failure break the import (best-effort persistence)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const brokenSink: RunSink = {
      record: async () => {
        throw new Error("db down")
      },
    }
    // The import result must still come back even though recording failed.
    const result = await recordImportRun({
      provider: "sportsdataio",
      entity: "news",
      sink: brokenSink,
      run: async () => "ok",
      normalize: () => ({ inserted: 1 }),
    })
    expect(result).toBe("ok")
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
