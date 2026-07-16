#!/usr/bin/env node

/**
 * Weather Intelligence Pipeline Diagnostic
 * 
 * Run this script to test the entire weather import pipeline:
 * - Verifies OpenWeather API key is configured
 * - Checks if tournaments exist in the forecast window
 * - Probes the OpenWeather provider
 * - Attempts a test import
 * - Reports results and recommendations
 * 
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project \
 *     scripts/test-weather-pipeline.mts
 */

import { prisma } from '@/lib/prisma'
import { importWeather, probeWeatherProvider } from '@/lib/imports'
import { isOpenWeatherConfigured } from '@/lib/providers/weather/config'

async function main() {
  console.log('\n=== Weather Intelligence Pipeline Diagnostic ===\n')

  // Step 1: Check API key
  console.log('📋 Step 1: Checking OpenWeather API key configuration...')
  const hasApiKey = isOpenWeatherConfigured()
  if (!hasApiKey) {
    console.error('❌ OPENWEATHER_API_KEY is not set!')
    console.error('   Set it via: export OPENWEATHER_API_KEY="your-api-key"')
    process.exit(1)
  }
  console.log('✅ API key is configured\n')

  // Step 2: Probe provider
  console.log('📋 Step 2: Probing OpenWeather provider...')
  try {
    const health = await probeWeatherProvider()
    if (health.ok) {
      console.log(`✅ Provider is healthy`)
      console.log(`   Status: ${health.status}`)
      console.log(`   Latency: ${health.latencyMs}ms`)
      console.log(`   Periods: ${health.periods}\n`)
    } else {
      console.error(`❌ Provider probe failed: ${health.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Provider probe error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }

  // Step 3: Check tournament window
  console.log('📋 Step 3: Checking tournament forecast window...')
  const horizon = new Date(Date.now() + 6 * 86_400_000)
  const tournaments = await prisma.tournament.findMany({
    where: {
      deletedAt: null,
      status: { not: 'CANCELED' },
      startDate: {
        lte: horizon,
        gte: new Date(Date.now() - 5 * 86_400_000),
      },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      course: { select: { latitude: true, longitude: true } },
    },
  })

  console.log(`Found ${tournaments.length} tournaments in forecast window`)
  if (tournaments.length === 0) {
    console.warn('⚠️  No tournaments in forecast window.')
    console.log('   Recommendations:')
    console.log('   - Create a tournament with startDate within the next 6 days')
    console.log('   - Link it to a course with coordinates set')
    process.exit(1)
  }

  for (const t of tournaments) {
    const hasCoords = t.course?.latitude && t.course?.longitude
    console.log(`  ${hasCoords ? '✅' : '❌'} ${t.name} (${t.startDate.toISOString().slice(0, 10)})`)
    if (!hasCoords) {
      console.log(`     → Course has no coordinates; will skip`)
    }
  }
  console.log()

  // Step 4: Run import
  console.log('📋 Step 4: Running weather import...')
  try {
    const summary = await importWeather()
    console.log(`✅ Import completed`)
    console.log(`   Considered: ${summary.tournamentsConsidered}`)
    console.log(`   Stored: ${summary.stored}`)
    console.log(`   Skipped: ${summary.skippedNoCourse + summary.skippedNoCoordinates}`)
    console.log(`   Failed: ${summary.failed}`)
    console.log(`   Periods: ${summary.periodsStored}\n`)

    if (summary.notes.length > 0) {
      console.log('Notes:')
      summary.notes.forEach(note => console.log(`  - ${note}`))
      console.log()
    }

    if (summary.stored > 0) {
      console.log('✅ SUCCESS: Weather data was imported and persisted!')
      console.log('   - weather_snapshots table has new data')
      console.log('   - weather_periods table has forecast periods')
      console.log('   - Tournament page will display Weather Intelligence\n')
    } else if (summary.failed > 0) {
      console.error('❌ FAILURE: Import failed')
      console.error(`   ${summary.notes[0] ?? 'Check logs for details'}\n`)
      process.exit(1)
    } else {
      console.warn('⚠️  SKIPPED: No snapshots were stored')
      console.log(`   ${summary.notes[0] ?? 'Check the notes above'}\n`)
    }
  } catch (error) {
    console.error('❌ Import error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }

  // Step 5: Verify data
  console.log('📋 Step 5: Verifying data persistence...')
  const snapshot = await prisma.weatherSnapshot.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { periods: true },
  })

  if (snapshot) {
    console.log(`✅ Latest snapshot found:`)
    console.log(`   Tournament: ${snapshot.tournamentId}`)
    console.log(`   Periods: ${snapshot.periodCount}`)
    console.log(`   Captured: ${snapshot.capturedAt.toISOString()}`)
    console.log(`   Forecast: ${snapshot.forecastStart?.toISOString()} to ${snapshot.forecastEnd?.toISOString()}\n`)
  } else {
    console.warn('⚠️  No snapshots found in database')
  }

  console.log('✅ Diagnostic complete!\n')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
