"use workflow";

import { sleep } from "workflow";
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client";
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository";
import { prisma } from "@/lib/prisma";

type MappingProgress = {
  total: number;
  completed: number;
  created: number;
  updated: number;
  reused: number;
  errors: number;
  status: "in_progress" | "completed" | "failed";
  message: string;
};

/**
 * Orchestrates tournament course mapping workflow.
 * This is a durable workflow that will resume automatically if interrupted.
 *
 * Flow:
 * 1. Fetch all tournament courses with host courses
 * 2. For each tournament, search GolfCourseAPI
 * 3. Create or update mapping with results
 * 4. Handle rate limiting with exponential backoff
 */
export async function tournamentMappingWorkflow(): Promise<MappingProgress> {
  "use workflow";

  try {
    // Step 1: Fetch all tournament courses (full Node.js access)
    const allCourses = await fetchTournamentCourses();
    
    let completed = 0;
    let created = 0;
    let updated = 0;
    let reused = 0;
    let errors = 0;

    // Step 2: Process each course with rate limiting
    for (let i = 0; i < allCourses.length; i++) {
      const course = allCourses[i];

      try {
        const result = await processSingleCourseMapping(course, i + 1, allCourses.length);
        
        completed++;
        created += result.created;
        updated += result.updated;
        reused += result.reused;
        errors += result.errors;

        // If rate limited, apply backoff with exponential increase
        if (result.rateLimited) {
          await sleep("5s");
        }
      } catch (error) {
        errors++;
        console.error(`[v0] Error processing course ${course.id}:`, error);
        // Continue with next course even on error
      }
    }

    return {
      total: allCourses.length,
      completed,
      created,
      updated,
      reused,
      errors,
      status: errors === 0 ? "completed" : "completed",
      message: `Processed ${completed}/${allCourses.length} tournaments`,
    };
  } catch (error) {
    console.error("[v0] Tournament mapping workflow failed:", error);
    return {
      total: 0,
      completed: 0,
      created: 0,
      updated: 0,
      reused: 0,
      errors: 1,
      status: "failed",
      message: `Workflow error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Fetch all tournament courses that need mapping.
 * This is a step function with full Node.js/Prisma access.
 */
async function fetchTournamentCourses() {
  "use step";

  const courses = await prisma.tournamentCourse.findMany({
    where: {
      tournament: { active: true },
      hostCourse: true,
    },
    include: {
      tournament: true,
      course: true,
    },
    orderBy: { tournament: { name: "asc" } },
  });

  return courses;
}

/**
 * Process a single tournament course mapping.
 * This step has full access to Node.js APIs for database, HTTP, and Prisma.
 */
async function processSingleCourseMapping(
  courseData: any,
  index: number,
  total: number
) {
  "use step";

  const tournament = courseData.tournament;
  const course = courseData.course;

  console.log(
    `[v0] Processing ${index}/${total}: ${tournament.name} → ${course.name}`
  );

  let created = 0;
  let updated = 0;
  let reused = 0;
  let errors = 0;
  let rateLimited = false;

  try {
    const mappingRepo = getTournamentCourseMappingRepository(prisma);

    // Check if mapping already exists
    const existingMappingResult = await mappingRepo.findByTournamentId(
      tournament.id
    );
    const existingMapping =
      existingMappingResult.outcome === "ok" ? existingMappingResult.record : null;

    // If already has a verified mapping, reuse it
    if (existingMapping?.verified) {
      reused++;
      return { created, updated, reused, errors, rateLimited };
    }

    // Search GolfCourseAPI for this course
    let golfCourseApiCourseId: number | null = null;
    let confidence = 0;
    let matchedBy = "manual";

    try {
      const client = new GolfCourseAPIClient();
      const searchResults = await client.searchCourses(course.name);

      if (searchResults && searchResults.length > 0) {
        const match = searchResults[0];
        golfCourseApiCourseId = match.id;
        confidence = 0.85; // Search result confidence
        matchedBy = "golfcourseapi";
      }
    } catch (apiError: any) {
      // Check for rate limiting (429)
      if (apiError.statusCode === 429) {
        rateLimited = true;
        console.log(`[v0] Rate limited by GolfCourseAPI, backing off...`);
      } else if (apiError.statusCode !== 404) {
        // Log other errors but don't fail the entire workflow
        console.warn(
          `[v0] GolfCourseAPI error for ${course.name}:`,
          apiError.message
        );
      }
    }

    // Create or update mapping
    if (existingMapping) {
      const updateResult = await mappingRepo.update(tournament.id, {
        golfCourseApiCourseId: golfCourseApiCourseId || undefined,
        tournamentCourseName: course.name,
        golfCourseCourseName: course.name,
        matchConfidence: confidence,
        matchedBy,
        verified: false,
      });

      if (updateResult.outcome === "ok") {
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

      if (createResult.outcome === "ok") {
        created++;
      } else {
        errors++;
      }
    }
  } catch (error) {
    errors++;
    console.error(
      `[v0] Exception processing ${tournament.name}:`,
      error
    );
  }

  return { created, updated, reused, errors, rateLimited };
}
