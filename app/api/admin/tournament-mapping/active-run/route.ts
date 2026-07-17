import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get the most recent tournament mapping workflow run (running or completed).
 * Used on page load to reconnect to an active workflow if the browser was refreshed.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the most recent TournamentCourseMapping import run
    const latestRun = await prisma.importRun.findFirst({
      where: {
        pipeline: "TournamentCourseMapping",
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (!latestRun) {
      return NextResponse.json({
        data: {
          runId: null,
          status: "idle",
          message: "No workflow runs found",
        },
      });
    }

    // Return the most recent run info
    return NextResponse.json({
      data: {
        runId: latestRun.workflowRunId,
        status: latestRun.status,
        startedAt: latestRun.startedAt,
        completedAt: latestRun.completedAt,
        rowsImported: latestRun.rowsImported,
        errors: latestRun.errors,
        message: `Last run: ${latestRun.status} at ${latestRun.startedAt.toLocaleString()}`,
      },
    });
  } catch (error) {
    console.error("[v0] Error fetching active run:", error);
    return NextResponse.json(
      { error: "Failed to fetch active run" },
      { status: 500 }
    );
  }
}
