/**
 * Audit endpoint for weather import pipeline testing
 * 
 * GET /api/audit/weather-import - Run the weather import with full logging
 */

import { importWeather } from "@/lib/imports/weather-import"
import prismaClient from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    console.log("\n" + "=".repeat(80))
    console.log("[AUDIT] WEATHER IMPORT PIPELINE AUDIT - API ENDPOINT")
    console.log("=".repeat(80) + "\n")

    // Check initial database state
    console.log("[AUDIT] Initial Database State:")
    const initialLogs = await prismaClient.weatherImportLog.count()
    const initialSnapshots = await prismaClient.weatherSnapshot.count()
    const initialPeriods = await prismaClient.weatherPeriod.count()

    console.log(`  WeatherImportLog: ${initialLogs} rows`)
    console.log(`  WeatherSnapshot: ${initialSnapshots} rows`)
    console.log(`  WeatherPeriod: ${initialPeriods} rows\n`)

    // Run import
    console.log("[AUDIT] Running Weather Import Pipeline...")
    console.log("-".repeat(80) + "\n")

    const summary = await importWeather()

    console.log("\n" + "-".repeat(80))
    console.log("[AUDIT] Import Complete\n")

    // Check final database state
    console.log("[AUDIT] Final Database State:")
    const finalLogs = await prismaClient.weatherImportLog.count()
    const finalSnapshots = await prismaClient.weatherSnapshot.count()
    const finalPeriods = await prismaClient.weatherPeriod.count()

    console.log(`  WeatherImportLog: ${finalLogs} rows (+${finalLogs - initialLogs})`)
    console.log(`  WeatherSnapshot: ${finalSnapshots} rows (+${finalSnapshots - initialSnapshots})`)
    console.log(`  WeatherPeriod: ${finalPeriods} rows (+${finalPeriods - initialPeriods})`)

    // Build response
    const auditResult = {
      timestamp: new Date().toISOString(),
      environment: {
        databaseUrl: process.env.DATABASE_URL ? "SET" : "MISSING",
        openweatherApiKey: process.env.OPENWEATHER_API_KEY ? "SET" : "MISSING",
      },
      summary,
      databaseState: {
        initial: {
          importLogs: initialLogs,
          snapshots: initialSnapshots,
          periods: initialPeriods,
        },
        final: {
          importLogs: finalLogs,
          snapshots: finalSnapshots,
          periods: finalPeriods,
        },
        delta: {
          importLogs: finalLogs - initialLogs,
          snapshots: finalSnapshots - initialSnapshots,
          periods: finalPeriods - initialPeriods,
        },
      },
      analysis: {
        tournamentsConsidered: summary.tournamentsConsidered,
        fetched: summary.fetched,
        stored: summary.stored,
        skippedNoCourse: summary.skippedNoCourse,
        skippedNoCoordinates: summary.skippedNoCoordinates,
        failed: summary.failed,
        periodsWritten: summary.periodsStored,
      },
    }

    return Response.json(auditResult, { status: 200 })
  } catch (error) {
    console.error("[AUDIT] Error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
