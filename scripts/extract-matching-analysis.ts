import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mappings = await prisma.tournamentCourseMapping.findMany({
    include: {
      tournamentCourse: {
        include: {
          tournament: true,
        },
      },
    },
    orderBy: {
      matchConfidence: "asc",
    },
  });

  const below80 = mappings.filter((m) => m.matchConfidence < 80);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("DETAILED TOURNAMENT MATCHING ANALYSIS - BELOW 80% CONFIDENCE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log(`Total Below 80%: ${below80.length}\n`);

  for (const mapping of below80) {
    const tournament = mapping.tournamentCourse.tournament;
    console.log(`📍 ${tournament.name}`);
    console.log(`   Tournament Course: ${mapping.tournamentCourseName}`);
    console.log(`   Confidence: ${mapping.matchConfidence}%`);
    console.log(`   API ID: ${mapping.golfCourseApiCourseId || "NO MATCH"}`);
    console.log(`   Match Method: ${mapping.matchMethod}`);
    if (mapping.rawMatchingData) {
      console.log(`   Raw Data: ${JSON.stringify(mapping.rawMatchingData)}`);
    }
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
