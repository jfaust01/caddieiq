import { PrismaClient } from "./lib/generated/prisma/client.ts";

const prisma = new PrismaClient();

async function smokeTest() {
  try {
    console.log("[v0] ===== PRISMA SMOKE TEST (STRATEGY B - TypeScript) =====");
    
    console.log("[v0] 1. Import statement: import { PrismaClient } from './lib/generated/prisma/client.ts'");
    console.log("[v0] ✓ Import successful");
    
    console.log("[v0] 2. Connecting to database...");
    await prisma.$connect();
    console.log("[v0] ✓ Connected");
    
    console.log("[v0] 3. Executing SELECT 1...");
    const result1 = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("[v0] ✓ SELECT 1 passed");
    
    console.log("[v0] 4. Querying Mexico Open tournament...");
    const tournament = await prisma.tournament.findUnique({
      where: { id: "cmrlmaawo00034zpaqvnwtvy4" },
      select: { 
        id: true, 
        name: true, 
        status: true,
        lock_datetime: true
      }
    });
    console.log("[v0] ✓ Tournament query successful");
    console.log("[v0]   Name:", tournament?.name);
    console.log("[v0]   Status:", tournament?.status);
    console.log("[v0]   Lock datetime:", tournament?.lock_datetime);
    
    console.log("[v0] 5. Querying Course relation...");
    const tournamentCourse = await prisma.tournamentCourse.findFirst({
      where: { tournamentId: "cmrlmaawo00034zpaqvnwtvy4", year: 2025 },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            timezone: true,
            par: true,
            yardage: true
          }
        }
      }
    });
    console.log("[v0] ✓ Course relation query successful");
    if (tournamentCourse) {
      console.log("[v0]   Course:", tournamentCourse.course.name);
      console.log("[v0]   Timezone:", tournamentCourse.course.timezone);
    }
    
    console.log("[v0] 6. Field count query...");
    const fieldCount = await prisma.tournamentField.count({
      where: { tournamentId: "cmrlmaawo00034zpaqvnwtvy4" }
    });
    console.log("[v0] ✓ Field count:", fieldCount);
    
    await prisma.$disconnect();
    console.log("[v0] ✓ Disconnected");
    
    console.log("[v0] ===== SMOKE TEST PASSED (EXIT CODE 0) =====");
    process.exit(0);
  } catch (error) {
    console.error("[v0] ✗ SMOKE TEST FAILED");
    console.error("[v0] Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

smokeTest();
