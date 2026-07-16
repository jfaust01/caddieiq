#!/usr/bin/env npx tsx

/**
 * Weather Import Audit Script
 * 
 * This script performs an end-to-end audit of the weather import pipeline,
 * logging each stage and identifying where the process may be failing.
 * 
 * Run with: npx tsx scripts/test-weather-audit.ts
 */

import prismaClient from "@/lib/prisma"
import { importWeather } from "@/lib/imports/weather-import"

async function auditWeatherPipeline() {
  console.log("\n" + "=".repeat(80))
  console.log("WEATHER IMPORT PIPELINE AUDIT")
  console.log("=".repeat(80) + "\n")
  
  try {
    // Check environment
    console.log("[AUDIT] Environment Check:")
    console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✓ SET" : "✗ MISSING")
    console.log("  OPENWEATHER_API_KEY:", process.env.OPENWEATHER_API_KEY ? "✓ SET" : "✗ MISSING")
    console.log()
    
    // Check database connectivity
    console.log("[AUDIT] Database Connectivity:")
    try {
      const tournaments = await prismaClient.tournament.findMany({
        where: { deletedAt: null, status: { not: "CANCELED" } },
        select: { id: true, name: true, startDate: true },
        take: 10,
      })
      console.log(`  ✓ Database connected - ${tournaments.length} tournaments found`)
      tournaments.forEach((t) => {
        const date = t.startDate ? t.startDate.toISOString().slice(0, 10) : "no date"
        console.log(`    - ${t.name} (${date})`)
      })
    } catch (error) {
      console.error("  ✗ Database connection failed:", error)
      return
    }
    console.log()
    
    // Check initial database state
    console.log("[AUDIT] Initial Database State:")
    const initialLogs = await prismaClient.weatherImportLog.count()
    const initialSnapshots = await prismaClient.weatherSnapshot.count()
    const initialPeriods = await prismaClient.weatherPeriod.count()
    
    console.log(`  WeatherImportLog: ${initialLogs} rows`)
    console.log(`  WeatherSnapshot: ${initialSnapshots} rows`)
    console.log(`  WeatherPeriod: ${initialPeriods} rows`)
    console.log()
    
    // Run import with detailed logging
    console.log("[AUDIT] Running Weather Import Pipeline...")
    console.log("-".repeat(80) + "\n")
    
    const summary = await importWeather()
    
    console.log("\n" + "-".repeat(80))
    console.log("[AUDIT] Import Complete\n")
    
    // Show final results
    console.log("[AUDIT] Final Database State:")
    const finalLogs = await prismaClient.weatherImportLog.count()
    const finalSnapshots = await prismaClient.weatherSnapshot.count()
    const finalPeriods = await prismaClient.weatherPeriod.count()
    
    console.log(`  WeatherImportLog: ${finalLogs} rows (+${finalLogs - initialLogs})`)
    console.log(`  WeatherSnapshot: ${finalSnapshots} rows (+${finalSnapshots - initialSnapshots})`)
    console.log(`  WeatherPeriod: ${finalPeriods} rows (+${finalPeriods - initialPeriods})`)
    console.log()
    
    // Show summary
    console.log("[AUDIT] Import Summary:")
    console.log(`  Tournaments considered: ${summary.tournamentsConsidered}`)
    console.log(`  Fetched from provider: ${summary.fetched}`)
    console.log(`  Stored to database: ${summary.stored}`)
    console.log(`  Skipped (no course): ${summary.skippedNoCourse}`)
    console.log(`  Skipped (no coordinates): ${summary.skippedNoCoordinates}`)
    console.log(`  Failed: ${summary.failed}`)
    console.log(`  Periods written: ${summary.periodsStored}`)
    console.log()
    
    if (summary.notes.length > 0) {
      console.log("[AUDIT] Notes:")
      summary.notes.forEach((note) => {
        console.log(`  - ${note}`)
      })
    }
    
    // Explain the results
    console.log()
    console.log("[AUDIT] Analysis:")
    if (summary.tournamentsConsidered === 0) {
      console.log(`  No tournaments qualified for import.`)
      console.log(`  Reason: ${summary.emptyReason}`)
    } else if (summary.stored === 0) {
      console.log(`  ${summary.tournamentsConsidered} tournaments were considered but none stored.`)
      if (summary.skippedNoCourse > 0) {
        console.log(`  - ${summary.skippedNoCourse} skipped because no host course was linked`)
      }
      if (summary.skippedNoCoordinates > 0) {
        console.log(`  - ${summary.skippedNoCoordinates} skipped because host course has no coordinates`)
      }
      if (summary.failed > 0) {
        console.log(`  - ${summary.failed} failed`)
      }
    } else {
      console.log(`  ✓ Successfully imported ${summary.stored} snapshots with ${summary.periodsStored} periods`)
    }
    
  } catch (error) {
    console.error("\n[AUDIT] Error:", error)
  } finally {
    await prismaClient.$disconnect()
  }
}

auditWeatherPipeline()
