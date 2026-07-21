const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function smokeTest() {
  try {
    console.log("[v0] ===== PRISMA SMOKE TEST =====");
    
    console.log("[v0] 1. Importing PrismaClient...");
    console.log("[v0] ✓ PrismaClient imported from @prisma/client");
    
    console.log("[v0] 2. Connecting to database...");
    await prisma.$connect();
    console.log("[v0] ✓ Connected");
    
    console.log("[v0] 3. Executing SELECT 1...");
    const result1 = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("[v0] ✓ SELECT 1 returned:", result1[0]);
    
    console.log("[v0] 4. Querying Mexico Open tournament...");
    const tournament = await prisma.tournament.findUnique({
      where: { id: "cmrlmaawo00034zpaqvnwtvy4" },
      select: { 
        id: true, 
        name: true, 
        status: true,
        startDate: true,
        endDate: true,
        lock_datetime: true
      }
    });
    console.log("[v0] ✓ Tournament found:");
    console.log("[v0]   Name:", tournament.name);
    console.log("[v0]   Status:", tournament.status);
    console.log("[v0]   Lock datetime:", tournament.lock_datetime);
    
    console.log("[v0] 5. Querying tournament course via TournamentCourse...");
    const tournamentCourse = await prisma.tournamentCourse.findFirst({
      where: { tournamentId: "cmrlmaawo00034zpaqvnwtvy4", year: 2025 },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            timezone: true,
            par: true,
            yardage: true
          }
        }
      }
    });
    console.log("[v0] ✓ Tournament-Course found:");
    console.log("[v0]   Course:", tournamentCourse.course.name);
    console.log("[v0]   Timezone:", tournamentCourse.course.timezone);
    console.log("[v0]   Par:", tournamentCourse.course.par);
    console.log("[v0]   Yardage:", tournamentCourse.course.yardage);
    
    console.log("[v0] 6. Counting tournament field records...");
    const fieldCount = await prisma.tournamentField.count({
      where: { tournamentId: "cmrlmaawo00034zpaqvnwtvy4" }
    });
    console.log("[v0] ✓ Field records:", fieldCount);
    
    console.log("[v0] 7. Disconnecting...");
    await prisma.$disconnect();
    console.log("[v0] ✓ Disconnected");
    
    console.log("[v0] ===== SMOKE TEST PASSED =====");
    process.exit(0);
  } catch (error) {
    console.error("[v0] SMOKE TEST FAILED");
    console.error("[v0] Error:", error.message);
    console.error("[v0] Stack:", error.stack);
    process.exit(1);
  }
}

smokeTest();
