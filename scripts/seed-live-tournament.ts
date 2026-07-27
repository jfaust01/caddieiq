#!/usr/bin/env node

/**
 * Seed script to insert a mock LIVE tournament with complete fantasy golf details.
 * Run: npx tsx scripts/seed-live-tournament.ts
 */

import prismaClient from '../lib/prisma'

const prisma = prismaClient

async function main() {
  try {
    console.log('[SEED] Starting mock live tournament insertion...')

    // Get PGA Tour
    const pga = await prisma.tour.findFirst({
      where: { type: 'PGA' },
    })

    if (!pga) {
      console.error('[ERROR] PGA Tour not found in database')
      process.exit(1)
    }

    console.log(`[OK] Found PGA Tour: ${pga.id}`)

    // Get latest season if available (optional for testing)
    const season = await prisma.season.findFirst({
      orderBy: { year: 'desc' },
    })

    if (season) {
      console.log(`[OK] Found Season: ${season.id} (Year ${season.year})`)
    } else {
      console.log(`[WARN] No seasons found - tournament will have null seasonId`)
    }

    // Get a course (Austin Country Club or first available)
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { name: { contains: 'Austin' } },
          { name: { contains: 'Caddie' } },
        ],
      },
    })

    let courseId = course?.id

    if (!courseId) {
      const firstCourse = await prisma.course.findFirst()
      courseId = firstCourse?.id

      if (!courseId) {
        console.error('[ERROR] No courses found in database')
        process.exit(1)
      }
    }

    console.log(`[OK] Using course: ${courseId}`)

    // Check if mock tournament already exists
    const existing = await prisma.tournament.findFirst({
      where: { slug: 'cadillac-championship-live-mock' },
    })

    if (existing) {
      console.log(`[SKIP] Mock tournament already exists: ${existing.id}`)
      await prisma.$disconnect()
      return
    }

    // Create the live tournament
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 1) // Started yesterday
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + 2) // Ends in 2 days

    const tournament = await prisma.tournament.create({
      data: {
        tourId: pga.id,
        seasonId: season?.id || null,
        name: 'Cadillac Championship',
        officialName: 'Cadillac Championship presented by Pebble Beach',
        slug: 'cadillac-championship-live-mock',
        status: 'ACTIVE', // LIVE status
        format: 'STROKE_PLAY',
        startDate,
        endDate,
        purse: 20000000,
        fedExPoints: 500,
        worldRankingPoints: 60,
        cutAfterRounds: 2,
        cutLine: 0,
        numberOfRounds: 4,
        active: true,
      },
    })

    console.log(`[OK] Created tournament: ${tournament.id}`)

    // Link the course to tournament
    const tournamentCourse = await prisma.tournamentCourse.create({
      data: {
        tournamentId: tournament.id,
        courseId,
        year: 2025,
        hostCourse: true,
      },
    })

    console.log(`[OK] Linked course: ${tournamentCourse.id}`)

    console.log('[OK] Mock tournament created successfully')

    console.log('\n[SUCCESS] Mock live tournament seeded!')
    console.log(`Tournament ID: ${tournament.id}`)
    console.log(`Tournament slug: ${tournament.slug}`)
    console.log(`Status: ${tournament.status}`)
    console.log(`Start: ${tournament.startDate?.toISOString()}`)
    console.log(`End: ${tournament.endDate?.toISOString()}`)
  } catch (error) {
    console.error('[ERROR] Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
