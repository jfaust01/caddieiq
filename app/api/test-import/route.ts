import { importHistoricalResults } from "@/lib/imports/historical-results-import"

export async function GET() {
  console.log("[API] /api/test-import: Invoked")
  
  try {
    const result = await importHistoricalResults()
    
    return Response.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("[API] /api/test-import: Error:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    }, { status: 500 })
  }
}
