import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getWorld } from "workflow/runtime"

/**
 * Get the status of the tournament mapping workflow using Workflow SDK.
 * Queries the World API to get the state of the most recent mapping workflow run.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the World API to query workflow state
    const world = await getWorld()

    // Get the most recent tournament mapping workflow run
    const { data: runs } = await world.runs.list({
      pagination: { cursor: undefined },
      resolveData: "none", // We only need status, not full data
    })

    // Find the most recent mapping workflow run
    const mappingRun = runs?.find(run => 
      run.name?.includes("tournamentMappingWorkflow")
    )

    if (!mappingRun) {
      // No mapping workflow has run yet
      return NextResponse.json({
        data: {
          status: "pending",
          total: 0,
          completed: 0,
          percentage: 0,
          message: "No mapping workflow has been started yet",
        },
      })
    }

    // Get the workflow run output to get progress data
    const fullRun = await world.runs.get(mappingRun.id, { resolveData: "all" })

    // Extract the MappingProgress result from the workflow
    const progress = fullRun.output || {
      total: 0,
      alreadyMapped: 0,
      completed: 0,
      created: 0,
      updated: 0,
      reused: 0,
      failed: 0,
      apiCallsMade: 0,
      totalDurationMs: 0,
      status: "in_progress",
      message: "Workflow in progress",
    }

    // Map workflow status to frontend status
    const status = fullRun.status === "completed" 
      ? "completed"
      : fullRun.status === "failed"
      ? "completed" // Show as completed even if there were errors
      : "in_progress"

    return NextResponse.json({
      data: {
        status,
        total: progress.total,
        alreadyMapped: progress.alreadyMapped || 0,
        completed: progress.completed,
        percentage: (progress.total - progress.alreadyMapped) > 0 
          ? Math.round((progress.completed / (progress.total - progress.alreadyMapped)) * 100) 
          : 100,
        created: progress.created,
        updated: progress.updated,
        reused: progress.reused,
        failed: progress.failed || 0,
        apiCallsMade: progress.apiCallsMade || 0,
        totalDurationMs: progress.totalDurationMs || 0,
        message: progress.message,
        runId: mappingRun.id,
      },
    })
  } catch (error) {
    console.error("[v0] Tournament mapping status error:", error)
    return NextResponse.json(
      { error: "Failed to get mapping status" },
      { status: 500 },
    )
  }
}
