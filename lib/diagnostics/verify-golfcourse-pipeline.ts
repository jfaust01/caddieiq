/**
 * GolfCourseAPI Pipeline Verification Script
 *
 * Diagnostic tool to verify the complete GolfCourseAPI import pipeline is working.
 * Run this after importing a tournament to verify each stage of the pipeline.
 *
 * Usage (from project root):
 *   npx ts-node lib/diagnostics/verify-golfcourse-pipeline.ts <tournamentId>
 */

import 'server-only'

import { getTournamentCourseMappingRepository } from '@/lib/repositories/tournament-course-mapping-repository'
import { getCourseDetailsRepository } from '@/lib/repositories/course-details-repository'
import { getCourseHoleRepository } from '@/lib/repositories/course-hole-repository'
import { getCourseTeeRepository } from '@/lib/repositories/course-tee-repository'

interface PipelineCheckResult {
  stage: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: Record<string, unknown>
}

/**
 * Run complete verification of GolfCourseAPI pipeline for a tournament
 */
export async function verifyGolfCourseAPIPipeline(
  tournamentId: string,
): Promise<PipelineCheckResult[]> {
  const results: PipelineCheckResult[] = []

  console.log(
    `\n${'='.repeat(60)}\nGolfCourseAPI Pipeline Verification\n${'='.repeat(60)}\n`,
  )

  // Stage 1: Check TournamentCourseMapping
  console.log('Stage 1: Checking TournamentCourseMapping...')
  try {
    const mappingRepo = getTournamentCourseMappingRepository()
    const mappingResult = await mappingRepo.findByTournamentId(tournamentId)

    if (mappingResult.outcome === 'ok' && mappingResult.record) {
      const mapping = mappingResult.record
      console.log('  ✅ PASS - Mapping found')
      console.log(`     Tournament ID: ${mapping.tournamentId}`)
      console.log(`     GolfCourse API ID: ${mapping.golfCourseApiCourseId}`)
      console.log(`     Match Confidence: ${mapping.matchConfidence}%`)
      console.log(`     Verified: ${mapping.verified}`)

      results.push({
        stage: 'TournamentCourseMapping',
        status: 'pass',
        message: 'Mapping found for tournament',
        details: {
          tournamentId: mapping.tournamentId,
          golfCourseApiCourseId: mapping.golfCourseApiCourseId,
          matchConfidence: mapping.matchConfidence,
          verified: mapping.verified,
        },
      })

      // Stage 2: Check CourseDetails
      console.log('\nStage 2: Checking CourseDetails...')
      const courseDetailsRepo = getCourseDetailsRepository()
      const courseResult = await courseDetailsRepo.findByExternalId(
        mapping.golfCourseApiCourseId.toString(),
      )

      if (courseResult.outcome === 'ok' && courseResult.record) {
        const course = courseResult.record
        console.log('  ✅ PASS - CourseDetails found')
        console.log(`     Course: ${course.courseName}`)
        console.log(`     Location: ${course.city}, ${course.state}, ${course.country}`)
        console.log(`     Par: ${course.par}, Yardage: ${course.totalYardage}`)

        results.push({
          stage: 'CourseDetails',
          status: 'pass',
          message: 'Course details record found',
          details: {
            courseName: course.courseName,
            par: course.par,
            totalYardage: course.totalYardage,
            courseRating: course.courseRating,
          },
        })

        // Stage 3: Check GolfCourseAPI Enrichment Fields
        console.log('\nStage 3: Checking GolfCourseAPI Enrichment Fields...')
        const enrichmentFields = {
          architect: course.architect,
          yearBuilt: course.yearBuilt,
          courseStyle: course.courseStyle,
          grassTypeFairway: course.grassTypeFairway,
          grassTypeGreen: course.grassTypeGreen,
          greenSize: course.greenSize,
          greenSpeed: course.greenSpeed,
          elevation: course.elevation,
          drivingRange: course.drivingRange,
          puttingGreen: course.puttingGreen,
          shortGameArea: course.shortGameArea,
        }

        const populatedFields = Object.entries(enrichmentFields).filter(
          ([, value]) => value !== null && value !== undefined,
        )
        const totalFields = Object.keys(enrichmentFields).length

        console.log(`  ✅ PASS - ${populatedFields.length}/${totalFields} enrichment fields populated`)
        populatedFields.forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`)
        })

        if (populatedFields.length === 0) {
          console.warn('  ⚠️  WARNING - No enrichment fields populated!')
          results.push({
            stage: 'GolfCourseAPI Enrichment',
            status: 'skip',
            message: 'No GolfCourseAPI enrichment fields populated (import may not have run)',
            details: enrichmentFields,
          })
        } else {
          results.push({
            stage: 'GolfCourseAPI Enrichment',
            status: 'pass',
            message: `${populatedFields.length} enrichment fields populated`,
            details: enrichmentFields,
          })
        }

        // Stage 4: Check Holes
        console.log('\nStage 4: Checking Course Holes...')
        const holesResult = await getCourseHoleRepository().findByCourseId(course.id)
        const holes = Array.isArray(holesResult) ? holesResult : []

        if (holes.length > 0) {
          console.log(`  ✅ PASS - ${holes.length} holes found`)
          results.push({
            stage: 'Course Holes',
            status: 'pass',
            message: `${holes.length} holes imported`,
            details: { holeCount: holes.length },
          })
        } else {
          console.warn('  ⚠️  WARNING - No holes found')
          results.push({
            stage: 'Course Holes',
            status: 'skip',
            message: 'No holes found (may not be imported yet)',
            details: { holeCount: 0 },
          })
        }

        // Stage 5: Check Tees
        console.log('\nStage 5: Checking Course Tees...')
        const teesResult = await getCourseTeeRepository().findByCourseId(course.id)
        const tees = Array.isArray(teesResult) ? teesResult : []

        if (tees.length > 0) {
          console.log(`  ✅ PASS - ${tees.length} tee sets found`)
          results.push({
            stage: 'Course Tees',
            status: 'pass',
            message: `${tees.length} tee sets imported`,
            details: { teeCount: tees.length },
          })
        } else {
          console.warn('  ⚠️  WARNING - No tees found')
          results.push({
            stage: 'Course Tees',
            status: 'skip',
            message: 'No tees found (may not be imported yet)',
            details: { teeCount: 0 },
          })
        }
      } else {
        console.error('  ❌ FAIL - CourseDetails not found')
        results.push({
          stage: 'CourseDetails',
          status: 'fail',
          message: 'CourseDetails record not found in database',
          details: { golfCourseApiId: mapping.golfCourseApiCourseId },
        })
      }
    } else {
      console.error('  ❌ FAIL - No mapping found')
      results.push({
        stage: 'TournamentCourseMapping',
        status: 'fail',
        message: 'No TournamentCourseMapping found for this tournament',
        details: { tournamentId },
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`  ❌ ERROR: ${message}`)
    results.push({
      stage: 'TournamentCourseMapping',
      status: 'fail',
      message: `Error checking mapping: ${message}`,
    })
  }

  // Summary
  console.log(`\n${'='.repeat(60)}\nSummary\n${'='.repeat(60)}\n`)
  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const skipped = results.filter((r) => r.status === 'skip').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log()

  if (failed > 0) {
    console.log('Issues to resolve:')
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        console.log(`  - ${r.stage}: ${r.message}`)
      })
    console.log()
  }

  return results
}

/**
 * Main entry point for CLI usage
 */
async function main() {
  const args = process.argv.slice(2)
  const tournamentId = args[0]

  if (!tournamentId) {
    console.error('Usage: npx ts-node verify-golfcourse-pipeline.ts <tournamentId>')
    process.exit(1)
  }

  try {
    await verifyGolfCourseAPIPipeline(tournamentId)
  } catch (error) {
    console.error('Verification failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export type { PipelineCheckResult }
