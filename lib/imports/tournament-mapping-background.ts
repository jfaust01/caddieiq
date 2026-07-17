import { prisma } from "@/lib/prisma"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"

/**
 * Background job for processing tournament course mappings
 * Runs independently with exponential backoff for API rate limiting
 */
export async function processTournamentCourseMapping() {
  const client = new GolfCourseAPIClient()
  const startTime = Date.now()

  console.log("[v0] Background mapping job started")

  try {
    // Get all active tournament courses that need mapping
    const allTournamentCourses = await prisma.tournamentCourse.findMany({
      where: {
        tournament: { active: true },
        hostCourse: true,
      },
      include: {
        tournament: true,
        course: true,
      },
      orderBy: { tournament: { name: "asc" } },
    })

    console.log(`[v0] Found ${allTournamentCourses.length} tournament courses to process`)

    let processed = 0
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    let backoffMs = 100 // Start with 100ms backoff

    for (const tournamentCourse of allTournamentCourses) {
      const tournament = tournamentCourse.tournament
      const course = tournamentCourse.course

      if (!course) {
        console.log(`[v0] [BG] Skipping ${tournament.name}: no course found`)
        skipped++
        continue
      }

      try {
        // Check if mapping already exists
        const existingMapping = await prisma.tournamentCourseMapping.findUnique({
          where: { tournamentId: tournament.id },
        })

        if (existingMapping) {
          console.log(`[v0] [BG] Mapping exists for ${tournament.name}, skipping`)
          skipped++
          processed++
          continue
        }

        // Search GolfCourseAPI with exponential backoff
        let searchResults = null
        let attempt = 0
        const maxAttempts = 3

        while (attempt < maxAttempts) {
          try {
            console.log(
              `[v0] [BG] Searching GolfCourseAPI for "${course.name}" (attempt ${attempt + 1}/${maxAttempts})`,
            )
            searchResults = await client.searchCourses(course.name)
            backoffMs = 100 // Reset backoff on success
            break
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)

            // Check for 429 (Too Many Requests) or other rate limit errors
            if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
              attempt++
              if (attempt < maxAttempts) {
                console.log(`[v0] [BG] Rate limited. Waiting ${backoffMs}ms before retry...`)
                await new Promise((resolve) => setTimeout(resolve, backoffMs))
                backoffMs = Math.min(backoffMs * 2, 5000) // Exponential backoff, max 5s
              } else {
                throw new Error(`Failed to search after ${maxAttempts} attempts: ${errorMessage}`)
              }
            } else {
              throw error
            }
          }
        }

        // Determine match confidence and matched by source
        let golfCourseApiCourseId = 0
        let confidence = 0.0
        let matchedBy = "manual"

        if (searchResults && searchResults.length > 0) {
          const bestMatch = searchResults[0]
          golfCourseApiCourseId = bestMatch.id
          // Simple confidence based on match order (first = highest confidence)
          confidence = 1.0 - searchResults.length * 0.1 // Decreases with number of results
          confidence = Math.max(0.5, Math.min(1.0, confidence)) // Clamp to 0.5-1.0
          matchedBy = "golfCourseAPI"

          console.log(
            `[v0] [BG] Found match for ${course.name}: ${bestMatch.name} (confidence: ${confidence.toFixed(2)})`,
          )
        } else {
          console.log(`[v0] [BG] No match found for ${course.name}`)
          matchedBy = "unmatched"
        }

        // Create or upsert mapping
        const mapping = await prisma.tournamentCourseMapping.upsert({
          where: { tournamentId: tournament.id },
          create: {
            tournamentId: tournament.id,
            sportsDataIoCourseId: undefined,
            golfCourseApiCourseId: golfCourseApiCourseId || null,
            tournamentCourseName: course.name,
            golfCourseCourseName: searchResults?.[0]?.name || course.name,
            matchConfidence: confidence,
            matchedBy,
            verified: false,
          },
          update: {
            golfCourseApiCourseId: golfCourseApiCourseId || null,
            matchConfidence: confidence,
            matchedBy,
          },
        })

        if (mapping) {
          console.log(`[v0] [BG] Created/updated mapping for ${tournament.name}`)
          created++
        }

        processed++
      } catch (error) {
        errors++
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`[v0] [BG] Error processing ${tournament.name}:`, errorMessage)
      }
    }

    const durationMs = Date.now() - startTime
    console.log(
      `[v0] Background mapping job completed in ${durationMs}ms: ${processed}/${allTournamentCourses.length} processed, ${created} created, ${skipped} skipped, ${errors} errors`,
    )

    return {
      ok: errors === 0,
      processed,
      created,
      updated,
      skipped,
      errors,
      durationMs,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Background mapping job failed:", errorMessage)
    throw error
  }
}
