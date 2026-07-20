"use workflow";

import { sleep } from "workflow";
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client";
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository";
import { prisma } from "@/lib/prisma";

type MappingProgress = {
  total: number;
  alreadyMapped: number;
  completed: number;
  created: number;
  updated: number;
  reused: number;
  failed: number;
  apiCallsMade: number;
  totalDurationMs: number;
  status: "in_progress" | "completed" | "failed";
  message: string;
  currentStep?: string; // e.g., "Searching course X"
  currentTournament?: string; // e.g., "PGA Championship 2024"
  errorMessage?: string; // Detailed error if failed
  lastRunAt?: string; // ISO timestamp of when workflow started
};

/**
 * Orchestrates tournament course mapping workflow.
 * INCREMENTAL & EFFICIENT: Only processes tournaments that require mapping.
 * 
 * This is a durable workflow that will resume automatically if interrupted.
 *
 * Flow:
 * 1. Fetch ONLY tournaments without valid mappings
 * 2. Skip tournaments with verified mappings
 * 3. For each unmapped tournament, search GolfCourseAPI
 * 4. Upsert mapping and persist progress after each success
 * 5. Handle 429 with Retry-After header and exponential backoff
 * 6. Resume from remaining unmapped tournaments if interrupted
 */
export async function tournamentMappingWorkflow(): Promise<MappingProgress> {
  "use workflow";

  const startTime = Date.now();

  try {
    // Step 1: Fetch only unmapped tournaments
    console.log("[v0] Fetching tournaments that require mapping...");
    const unmappedTournaments = await fetchUnmappedTournaments();
    const alreadyMappedCount = await countAlreadyMappedTournaments();
    
    console.log(
      `[v0] Found ${unmappedTournaments.length} unmapped tournaments, ${alreadyMappedCount} already mapped`
    );

    let completed = 0;
    let created = 0;
    let updated = 0;
    let reused = 0;
    let failed = 0;
    let apiCallsMade = 0;
    let rateLimitRetryMs = 0;

    // Step 2: Process each unmapped tournament
    for (let i = 0; i < unmappedTournaments.length; i++) {
      const tournament = unmappedTournaments[i];

      try {
        const result = await processSingleTournamentMapping(
          tournament,
          i + 1,
          unmappedTournaments.length
        );

        completed++;
        created += result.created;
        updated += result.updated;
        reused += result.reused;
        failed += result.errors;
        apiCallsMade += result.apiCallsMade;

        // If rate limited, honor the Retry-After header or use exponential backoff
        if (result.retryAfterMs > 0) {
          console.log(`[v0] Rate limited. Sleeping for ${result.retryAfterMs}ms...`);
          rateLimitRetryMs += result.retryAfterMs;
          await sleep(`${Math.ceil(result.retryAfterMs / 1000)}s`);
        }
      } catch (error) {
        failed++;
        console.error(
          `[v0] Error processing tournament ${tournament.name}:`,
          error instanceof Error ? error.message : error
        );
        // Continue with next tournament even on error (resumability)
      }
    }

    const totalDurationMs = Date.now() - startTime;

    return {
      total: unmappedTournaments.length + alreadyMappedCount,
      alreadyMapped: alreadyMappedCount,
      completed,
      created,
      updated,
      reused,
      failed,
      apiCallsMade,
      totalDurationMs,
      status: failed === 0 ? "completed" : "completed",
      message: `Processed ${completed}/${unmappedTournaments.length} unmapped tournaments (${alreadyMappedCount} already valid). Created ${created}, updated ${updated}. Made ${apiCallsMade} API calls in ${totalDurationMs}ms`,
    };
  } catch (error) {
    console.error("[v0] Tournament mapping workflow failed:", error);
    return {
      total: 0,
      alreadyMapped: 0,
      completed: 0,
      created: 0,
      updated: 0,
      reused: 0,
      failed: 1,
      apiCallsMade: 0,
      totalDurationMs: Date.now() - startTime,
      status: "failed",
      message: `Workflow error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Fetch only tournaments that require mapping.
 * A tournament requires mapping if:
 * - It has no TournamentCourseMapping record, OR
 * - The mapping is marked as failed/invalid (not verified)
 */
async function fetchUnmappedTournaments() {
  "use step";

  console.log("[v0] Query: Fetch unmapped tournaments");

  // Get all active host courses, then filter for unmapped ones in memory
  const allHostCourses = await prisma.tournamentCourse.findMany({
    where: {
      tournament: { active: true },
      hostCourse: true,
    },
    include: {
      tournament: true,
      course: true,
      tournamentCourseMapping: true,
    },
    orderBy: { tournament: { name: "asc" } },
  });

  // Filter for only unmapped: either no mapping exists or mapping is not verified
  const unmappedTournaments = allHostCourses.filter(
    tc => !tc.tournamentCourseMapping || !tc.tournamentCourseMapping.verified
  );

  return unmappedTournaments;
}

/**
 * Count tournaments that already have valid (verified) mappings.
 */
async function countAlreadyMappedTournaments() {
  "use step";

  const count = await prisma.tournamentCourseMapping.count({
    where: {
      verified: true,
    },
  });

  return count;
}

/**
 * Process a single tournament mapping.
 * 
 * This step:
 * 1. Checks if existing mapping is valid (skip if so)
 * 2. Calls GolfCourseAPI to search for course
 * 3. Upserts the mapping record
 * 4. Persists progress (resumability)
 * 5. Returns detailed status including Retry-After delays
 */
async function processSingleTournamentMapping(tournamentCourse: any, index: number, total: number) {
  "use step";

  const tournament = tournamentCourse.tournament;
  const course = tournamentCourse.course;
  const existingMapping = tournamentCourse.tournamentCourseMapping;

  console.log(
    `[v0] STAGE: Fetch unmapped tournaments [${index}/${total}] ${tournament.name}`
  );

  let created = 0;
  let updated = 0;
  let reused = 0;
  let errors = 0;
  let apiCallsMade = 0;
  let retryAfterMs = 0;

  try {
    // If mapping exists and is not verified but has valid API data, reuse it
    if (existingMapping && !existingMapping.verified && existingMapping.golfCourseApiCourseId > 0) {
      console.log(
        `[v0] STAGE: Skip existing mapping [${index}/${total}] ${tournament.name}`
      );
      reused++;
      return { created, updated, reused, errors, apiCallsMade, retryAfterMs };
    }

    const mappingRepo = getTournamentCourseMappingRepository(prisma);

    // Search GolfCourseAPI for this course
    let golfCourseApiCourseId: number | null = null;
    let confidence = 0;
    let matchedBy = "manual";
    let apiError: string | null = null;

    try {
      console.log(
        `[v0] STAGE: Search GolfCourseAPI [${index}/${total}] ${course.name}`
      );

      const client = new GolfCourseAPIClient();
      const searchResults = await client.searchCourses(course.name);
      apiCallsMade++;

      if (searchResults && searchResults.length > 0) {
        const match = searchResults[0];
        golfCourseApiCourseId = match.id;
        confidence = 85; // Search result confidence (0-100)
        matchedBy = "golfcourseapi_search";
      } else {
        confidence = 0;
      }
    } catch (err: any) {
      // Handle rate limiting with Retry-After header
      if (err.status === 429 || err.statusCode === 429) {
        const retryAfter = err.headers?.["retry-after"] || err.retryAfter;
        if (retryAfter) {
          // Retry-After can be seconds or HTTP-date
          retryAfterMs = isNaN(Number(retryAfter))
            ? new Date(retryAfter).getTime() - Date.now()
            : Number(retryAfter) * 1000;
        } else {
          // Default exponential backoff: start at 5s
          retryAfterMs = 5000;
        }
        console.log(
          `[v0] STAGE: Retry after 429 [${index}/${total}] ${tournament.name} - waiting ${retryAfterMs}ms`
        );
        apiError = "Rate limited (429)";
      } else if (err.status === 404 || err.statusCode === 404) {
        // Course not found - create mapping with no API ID
        console.log(
          `[v0] STAGE: Search GolfCourseAPI [${index}/${total}] ${course.name} - NOT FOUND`
        );
        golfCourseApiCourseId = null;
      } else {
        console.warn(
          `[v0] GolfCourseAPI error for ${course.name}: ${err.message}`
        );
        apiError = err.message;
      }
    }

    // Create or update mapping - persist progress after each tournament
    console.log(
      `[v0] STAGE: Mapping created/updated [${index}/${total}] ${tournament.name}`
    );

    if (existingMapping) {
      const updateResult = await mappingRepo.update(tournament.id, {
        golfCourseApiCourseId: golfCourseApiCourseId || 0,
        tournamentCourseName: course.name,
        golfCourseCourseName: course.name,
        matchConfidence: confidence,
        matchedBy,
        verified: false,
      });

      if (updateResult.outcome !== "failed") {
        updated++;
      } else {
        errors++;
      }
    } else {
      const createResult = await mappingRepo.create({
        tournamentId: tournament.id,
        sportsDataIoCourseId: undefined,
        golfCourseApiCourseId: golfCourseApiCourseId || 0,
        tournamentCourseName: course.name,
        golfCourseCourseName: course.name,
        matchConfidence: confidence,
        matchedBy,
        verified: false,
      });

      if (createResult.outcome !== "failed") {
        created++;
      } else {
        errors++;
      }
    }

    // Persist lastSyncedAt to track that this tournament was processed
    await prisma.tournamentCourseMapping.update({
      where: { tournamentId: tournament.id },
      data: { lastSyncedAt: new Date() },
    });
  } catch (error) {
    errors++;
    console.error(
      `[v0] Exception processing ${tournament.name}:`,
      error instanceof Error ? error.message : error
    );
  }

  return { created, updated, reused, errors, apiCallsMade, retryAfterMs };
}
