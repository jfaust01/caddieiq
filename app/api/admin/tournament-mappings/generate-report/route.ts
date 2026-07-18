import { generateConfidenceMigrationReport } from "@/lib/workflows/confidence-migration-report-workflow"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const report = await generateConfidenceMigrationReport()

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
