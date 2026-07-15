import { test } from "vitest"
import prisma from "@/lib/prisma"

test("stats table reachable", async () => {
  const count = await prisma.playerSeasonStatistic.count()
  // eslint-disable-next-line no-console
  console.log("[v0] player_season_statistics count:", count)
})
