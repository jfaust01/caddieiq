import { start } from "workflow/api";
import { tournamentMappingWorkflow } from "@/lib/workflows/tournament-mapping-workflow";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Starts the tournament course mapping workflow.
 * Returns 202 Accepted immediately - the workflow runs independently.
 */
export async function POST() {
  try {
    // Authenticate
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Start the workflow - returns immediately, runs durably
    const run = await start(tournamentMappingWorkflow, []);

    console.log(`[v0] Tournament mapping workflow started: ${run.runId}`);

    // Create ImportRun record to persist workflow execution history
    try {
      await prisma.importRun.create({
        data: {
          pipeline: "TournamentCourseMapping",
          status: "in_progress",
          startedAt: new Date(),
          workflowRunId: run.runId,
          rowsImported: 0,
          errors: 0,
        },
      });
      console.log(`[v0] Created ImportRun record for workflow ${run.runId}`);
    } catch (dbError) {
      console.warn(`[v0] Failed to create ImportRun record:`, dbError);
      // Don't fail the whole operation if DB tracking fails
    }

    return Response.json(
      {
        success: true,
        data: {
          runId: run.runId,
          message: "Tournament course mapping workflow started",
          status: "pending",
        },
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[v0] Error starting workflow:", error);
    return Response.json(
      { error: "Failed to start mapping workflow" },
      { status: 500 }
    );
  }
}
