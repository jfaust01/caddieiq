import { NextResponse } from "next/server"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"
import prismaClient from "@/lib/prisma"

/**
 * Diagnostic endpoint - captures full importer instrumentation logs
 * No authentication required for debugging
 */
export async function GET() {
  const logs: string[] = []
  
  // Intercept console.log to capture all output
  const originalLog = console.log
  console.log = (...args: any[]) => {
    logs.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '))
    originalLog(...args)
  }

  try {
    // Run the importer
    const result = await importCourseIntelligence(undefined, prismaClient)

    // Restore console.log
    console.log = originalLog

    return NextResponse.json({
      success: true,
      result: {
        jobId: result.jobId,
        coursesConsidered: result.coursesConsidered,
        coursesMatched: result.coursesMatched,
        coursesImported: result.coursesImported,
        coursesUpdated: result.coursesUpdated,
        durationMs: result.durationMs,
        failures: result.failures?.length ?? 0,
      },
      logs: logs.join('\n'),
    })
  } catch (error) {
    console.log = originalLog
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: logs.join('\n'),
    }, { status: 500 })
  }
}
