const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("[v0] Connecting...");
    await prisma.$connect();
    console.log("[v0] Connected");

    console.log("[v0] Querying Mexico Open...");
    const tournament = await prisma.tournament.findUnique({
      where: { id: "cmrlmaawo00034zpaqvnwtvy4" },
      select: { id: true, name: true, status: true }
    });
    console.log("[v0] Tournament:", tournament);

    console.log("[v0] Field count...");
    const fieldCount = await prisma.tournamentField.count({
      where: { tournamentId: "cmrlmaawo00034zpaqvnwtvy4" }
    });
    console.log("[v0] Field count:", fieldCount);

    await prisma.$disconnect();
    console.log("[v0] SUCCESS");
    process.exit(0);
  } catch (error) {
    console.error("[v0] ERROR:", error.message);
    process.exit(1);
  }
}

test();
