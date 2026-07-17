import { start } from "workflow/api";
import { tournamentMappingWorkflow } from "@/lib/workflows/tournament-mapping-workflow";
import { auth } from "@/lib/auth";
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
