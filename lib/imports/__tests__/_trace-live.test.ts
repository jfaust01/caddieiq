/**
 * TEMPORARY live trace — not a real test. Delete after use.
 */
import { describe, it } from "vitest"

import { SportsDataProvider } from "@/lib/providers/sportsdataio"
import { mapSportsDataPlayer } from "@/lib/domain"
import { validatePlayers } from "@/lib/data-quality"

describe("live player import trace (no persist)", () => {
  it("counts stages", async () => {
    const provider = SportsDataProvider.fromEnv()
    const t0 = Date.now()
    const res = await provider.listPlayers()
    console.log("[trace] fetch ms:", Date.now() - t0, "returned:", res.data.length)

    const mapped = res.data.map(mapSportsDataPlayer)
    const outcome = validatePlayers(mapped)
    const valid = outcome.evaluated.filter((e) => e.report.isValid).length
    console.log("[trace] mapped:", mapped.length, "quality summary:", JSON.stringify(outcome.summary), "passingQuality:", valid)
  }, 60_000)
})
