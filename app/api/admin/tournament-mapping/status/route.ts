import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRun } from "workflow/api"

/**
 * Get the status of the tournament mapping workflow using Workflow SDK.
 * Accepts an optional runId parameter to poll a specific run.
 * If no runId provided, returns pending status.
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

    // Get the run ID from query parameters
    const searchParams = request.nextUrl.searchParams
    const runId = searchParams.get("runId")

    if (!runId) {
      // No run ID provided - workflow hasn't been started yet
      return NextResponse.json({
        data: {
          status: "pending",
          total: 0,
          alreadyMapped: 0,
          completed: 0,
          percentage: 0,
          created: 0,
          updated: 0,
          reused: 0,
          failed: 0,
          apiCallsMade: 0,
          totalDurationMs: 0,
          message: "No mapping workflow has been started yet",
        },
      })
    }

    // Get the specific workflow run
    let mappingRun
    try {
      mappingRun = await getRun(runId)
    } catch (error) {
      console.error(`[v0] Error fetching workflow run ${runId}:`, error)
      return NextResponse.json({
        data: {
          status: "pending",
          total: 0,
          alreadyMapped: 0,
          completed: 0,
          percentage: 0,
          created: 0,
          updated: 0,
          reused: 0,
          failed: 0,
          apiCallsMade: 0,
          totalDurationMs: 0,
          message: "Workflow run not found",
        },
      })
    }

    if (!mappingRun) {
      return NextResponse.json({
        data: {
          status: "pending",
          total: 0,
          alreadyMapped: 0,
          completed: 0,
          percentage: 0,
          created: 0,
          updated: 0,
          reused: 0,
          failed: 0,
          apiCallsMade: 0,
          totalDurationMs: 0,
          message: "Workflow run not found",
        },
      })
    }

    // Extract the MappingProgress result from the workflow
    const progress = mappingRun.output || {
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
    let status: "in_progress" | "completed" | "failed" = "in_progress"
    if (mappingRun.status === "completed") {
      status = "completed"
    } else if (mappingRun.status === "failed" || mappingRun.status === "cancelled") {
      status = "failed"
    }

    // Calculate percentage based on unmapped count
    const unmappedTotal = progress.total - (progress.alreadyMapped || 0)
    const percentage = unmappedTotal > 0 
      ? Math.round((progress.completed / unmappedTotal) * 100) 
      : 100

    return NextResponse.json({
      data: {
        status,
        total: progress.total,
        alreadyMapped: progress.alreadyMapped || 0,
        completed: progress.completed,
        percentage,
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
