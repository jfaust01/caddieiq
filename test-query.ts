import prismaClient from "@/lib/prisma"

async function test() {
  try {
    const rounds = await prismaClient.playerRound.findMany({
      where: { roundId: "test-id" },
      include: {
        tournamentField: {
          include: { player: true },
        },
      },
    })
    console.log("[v0] Query succeeded, found rounds:", rounds.length)
  } catch (error: any) {
    console.error("[v0] Query failed:")
    console.error(error.message)
    console.error("Code:", error.code)
  } finally {
    await prismaClient.$disconnect()
  }
}

test()
