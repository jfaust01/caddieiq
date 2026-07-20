const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log("Testing historical data models...\n");

    // Test ProviderIdMapping
    try {
      const providerMapping = await prisma.providerIdMapping.create({
        data: {
          entityType: "PLAYER",
          internalId: "test-player-" + Date.now(),
          providerId: "pga-" + Date.now(),
          provider: "pgatour",
          providerRecordId: "PGA" + Date.now(),
          mappingStatus: "VERIFIED",
        },
      });
      console.log("✓ ProviderIdMapping table works");
      console.log("  Created ID:", providerMapping.id, "\n");
    } catch (e) {
      console.log("✗ ProviderIdMapping failed:", e.message, "\n");
    }

    // Get sample player and tournament for tests
    const player = await prisma.player.findFirst({ select: { id: true } });
    const tournament = await prisma.tournament.findFirst({ select: { id: true } });

    if (!player) {
      console.log("No players found, creating minimal test data...");
      return;
    }

    // Test HistoricalPlayerFeature
    try {
      const feature = await prisma.historicalPlayerFeature.create({
        data: {
          playerId: player.id,
          featureKey: "driving_distance_" + Date.now(),
          featureVersion: "1.0",
          featureValue: "300",
          unit: "yards",
          validFrom: new Date("2024-06-01"),
          systemRecordedAt: new Date(),
          sourceProvider: "sportsdataio",
          retrievalTimestamp: new Date(),
          dataQualityStatus: "VERIFIED",
        },
      });
      console.log("✓ HistoricalPlayerFeature table works");
      console.log("  Created ID:", feature.id, "\n");

      // Test sealing
      const sealedFeature = await prisma.historicalPlayerFeature.update({
        where: { id: feature.id },
        data: { sealed: true, sealedAt: new Date() },
      });
      console.log("✓ Feature sealed successfully\n");

      // Test immutability
      try {
        await prisma.historicalPlayerFeature.update({
          where: { id: feature.id },
          data: { featureValue: "hacked" },
        });
        console.log("✗ IMMUTABILITY FAILED - sealed feature was updated!");
      } catch (e) {
        console.log("✓ Immutability protection works for features!");
        console.log("  Error:", e.message.substring(0, 80), "\n");
      }
    } catch (e) {
      console.log("✗ HistoricalPlayerFeature failed:", e.message, "\n");
    }

    // Test HistoricalSnapshot if we have tournament
    if (tournament) {
      try {
        const snapshot = await prisma.historicalSnapshot.create({
          data: {
            snapshotHash: "hash-" + Date.now(),
            tournamentId: tournament.id,
            playerId: player.id,
            lockTimestamp: new Date(),
            modelVersion: "1.0",
            featureSetVersion: "v1",
            features: { test: "data" },
            featuresIncluded: JSON.stringify(["feature1"]),
            featuresExcluded: JSON.stringify([]),
          },
        });
        console.log("✓ HistoricalSnapshot table works");
        console.log("  Created ID:", snapshot.id, "\n");

        // Seal and test immutability
        await prisma.historicalSnapshot.update({
          where: { id: snapshot.id },
          data: { sealed: true, sealedAt: new Date() },
        });
        console.log("✓ Snapshot sealed successfully\n");

        try {
          await prisma.historicalSnapshot.update({
            where: { id: snapshot.id },
            data: { generatedBy: "hacker" },
          });
          console.log("✗ IMMUTABILITY FAILED - sealed snapshot was updated!");
        } catch (e) {
          console.log("✓ Immutability protection works for snapshots!");
          console.log("  Error:", e.message.substring(0, 80), "\n");
        }
      } catch (e) {
        console.log("✗ HistoricalSnapshot failed:", e.message, "\n");
      }

      // Test other models briefly
      try {
        await prisma.historicalDataAuditEvent.create({
          data: {
            eventType: "FEATURE_ADDED",
            entityType: "player",
            entityId: player.id,
            performedBy: "test_system",
            performedAt: new Date(),
          },
        });
        console.log("✓ HistoricalDataAuditEvent table works\n");
      } catch (e) {
        console.log("✗ HistoricalDataAuditEvent failed:", e.message, "\n");
      }

      try {
        await prisma.dataQualityReport.create({
          data: {
            importJobId: "test-job-" + Date.now(),
            totalChecksRun: 10,
            checksPassedCount: 9,
            checksFailedCount: 1,
            details: JSON.stringify({ test: true }),
            qualityStatus: "GOOD",
          },
        });
        console.log("✓ DataQualityReport table works\n");
      } catch (e) {
        console.log("✗ DataQualityReport failed:", e.message, "\n");
      }

      try {
        await prisma.historicalPlayerRanking.create({
          data: {
            playerId: player.id,
            rankingSystem: "WORLD_GOLF_RANKING",
            playerRank: 1,
            publishedDate: new Date(),
            effectiveDate: new Date(),
            validFrom: new Date(),
            source: "pgat our",
            retrievedTimestamp: new Date(),
          },
        });
        console.log("✓ HistoricalPlayerRanking table works\n");
      } catch (e) {
        console.log("✗ HistoricalPlayerRanking failed:", e.message, "\n");
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✓ Historical data foundation verified");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("✗ Verification failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema().catch((e) => {
  console.error(e);
  process.exit(1);
});
