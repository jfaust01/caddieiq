import { PrismaClient as GeneratedPrismaClient } from "../lib/generated/prisma/client";

class PrismaClient extends GeneratedPrismaClient {
  constructor() {
    super({});
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("TOURNAMENT COURSE MAPPING VERIFICATION STATUS ANALYSIS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Get all mappings
  const allMappings = await prisma.tournamentCourseMapping.findMany({
    orderBy: [{ verificationStatus: "asc" }, { matchConfidence: "desc" }],
  });

  console.log(`Total Mappings: ${allMappings.length}\n`);

  // Group by verification status
  const byVerificationStatus = allMappings.reduce(
    (acc, m) => {
      const status = m.verificationStatus || "UNKNOWN";
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(m);
      return acc;
    },
    {} as Record<string, typeof allMappings>
  );

  // Group by verified field
  const byVerifiedField = allMappings.reduce(
    (acc, m) => {
      const verified = m.verified ? "true" : "false";
      if (!acc[verified]) {
        acc[verified] = [];
      }
      acc[verified].push(m);
      return acc;
    },
    {} as Record<string, typeof allMappings>
  );

  // Print verification status breakdown
  console.log("📊 VERIFICATION STATUS BREAKDOWN:\n");
  for (const [status, mappings] of Object.entries(byVerificationStatus)) {
    const confidences = mappings.map((m) => m.matchConfidence);
    const avgConfidence = (
      confidences.reduce((a, b) => a + b, 0) / confidences.length
    ).toFixed(1);
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);

    console.log(`Status: ${status}`);
    console.log(`  Count: ${mappings.length}`);
    console.log(`  Confidence - Min: ${minConfidence}%, Avg: ${avgConfidence}%, Max: ${maxConfidence}%`);
    console.log("");
  }

  // Print verified field breakdown
  console.log("📊 VERIFIED FIELD BREAKDOWN:\n");
  for (const [verified, mappings] of Object.entries(byVerifiedField)) {
    const confidences = mappings.map((m) => m.matchConfidence);
    const avgConfidence = (
      confidences.reduce((a, b) => a + b, 0) / confidences.length
    ).toFixed(1);
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);

    console.log(`verified = ${verified}`);
    console.log(`  Count: ${mappings.length}`);
    console.log(`  Confidence - Min: ${minConfidence}%, Avg: ${avgConfidence}%, Max: ${maxConfidence}%`);
    console.log("");
  }

  // Confidence distribution
  console.log("📈 CONFIDENCE SCORE DISTRIBUTION:\n");
  const ranges = [
    { min: 80, max: 100, label: "80-100% (High)" },
    { min: 50, max: 79, label: "50-79% (Medium)" },
    { min: 1, max: 49, label: "1-49% (Low)" },
    { min: 0, max: 0, label: "0% (No Match)" },
  ];

  for (const range of ranges) {
    const inRange = allMappings.filter(
      (m) => m.matchConfidence >= range.min && m.matchConfidence <= range.max
    );
    const percent = ((inRange.length / allMappings.length) * 100).toFixed(1);
    console.log(`${range.label}: ${inRange.length} mappings (${percent}%)`);
  }

  // Cross-tabulation
  console.log("\n📋 CROSS-TABULATION (Verification Status × Verified Field):\n");
  console.log(
    "Status             | verified=true | verified=false | Total"
  );
  console.log(
    "───────────────────┼───────────────┼────────────────┼──────"
  );

  for (const status of Object.keys(byVerificationStatus).sort()) {
    const statusMappings = byVerificationStatus[status];
    const verified = statusMappings.filter((m) => m.verified).length;
    const notVerified = statusMappings.filter((m) => !m.verified).length;
    const total = statusMappings.length;

    console.log(
      `${status.padEnd(18)} | ${verified.toString().padStart(13)} | ${notVerified.toString().padStart(14)} | ${total}`
    );
  }

  // Show all mappings with details
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("DETAILED MAPPING LIST (sorted by verification status, then confidence):");
  console.log("═══════════════════════════════════════════════════════════════\n");

  for (const mapping of allMappings) {
    const verified = mapping.verified ? "✓" : "✗";
    const hasCourseId = mapping.golfCourseApiCourseId ? "✓" : "✗";

    console.log(
      `[${mapping.verificationStatus}] Confidence: ${mapping.matchConfidence}% | Verified: ${verified} | Has API ID: ${hasCourseId} | ${mapping.tournamentCourseName}`
    );
  }
}

main()
  .then(() => {
    console.log("\n");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
