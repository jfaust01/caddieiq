import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"

interface DiagnosticItem {
  tournamentId: string
  tournamentName: string
  sportsDataIOCourseName: string
  city?: string
  state?: string
  country?: string
  searchQuery: string
  golfCourseAPIResults: Array<{
    id: number
    name?: string
    city?: string
    state?: string
    country?: string
    nameScore: number
    locationScore: number
    totalScore: number
  }>
  bestMatchResult?: {
    courseId: number
    confidence: number
    reason: string
  }
  noMatchReason: string
  finalMatchConfidence: number
  finalGolfCourseApiId: number | null
}

export async function GET() {
  try {
    console.log("[v0] === MATCHING ENGINE DIAGNOSIS ===")

    const apiKey = process.env.GOLFCOURSE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GOLFCOURSE_API_KEY not set" }, { status: 500 })
    }

    const client = new GolfCourseAPIClient(apiKey)

    // Get all tournament courses
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

    console.log(`[v0] Found ${allTournamentCourses.length} tournament courses to diagnose`)

    const diagnostics: DiagnosticItem[] = []

    for (const tournamentCourse of allTournamentCourses) {
      const tournament = tournamentCourse.tournament
      const course = tournamentCourse.course

      if (!course) {
        continue
      }

      console.log(`[v0] Diagnosing: ${tournament.name} → ${course.name}`)

      let searchResults: any[] = []
      let searchError: string | null = null

      // Try GolfCourse API search
      try {
        searchResults = (await client.searchCourses(course.name)) || []
      } catch (error) {
        searchError = error instanceof Error ? error.message : String(error)
        console.log(`[v0] Search error for "${course.name}": ${searchError}`)
      }

      // Helper function to calculate scores (copy of matcher logic for diagnostics)
      function normalize(str?: string): string {
        if (!str) return ""
        return str.toLowerCase().trim().replace(/\s+/g, " ")
      }

      function calculateStringSimilarity(a: string, b: string): number {
        if (!a || !b) return 0
        if (a === b) return 100

        const maxLen = Math.max(a.length, b.length)
        let matches = 0
        let ai = 0
        let bi = 0

        while (ai < a.length && bi < b.length) {
          if (a[ai] === b[bi]) {
            matches++
            ai++
            bi++
          } else {
            ai++
          }
        }

        const matchRatio = matches / maxLen
        return Math.round(matchRatio * 100)
      }

      function matchCourseName(sportsdataioName: string, golfcourseapiName: string): number {
        const sdName = normalize(sportsdataioName)
        const gcName = normalize(golfcourseapiName)

        if (sdName === gcName) return 100
        if (sdName.includes(gcName) || gcName.includes(sdName)) return 95

        const cleanSdName = sdName.replace(/\s*(golf\s*club|gc|country\s*club|cc)$/i, "").trim()
        const cleanGcName = gcName.replace(/\s*(golf\s*club|gc|country\s*club|cc)$/i, "").trim()

        if (cleanSdName === cleanGcName) return 92
        if (cleanSdName.includes(cleanGcName) || cleanGcName.includes(cleanSdName)) return 90

        return calculateStringSimilarity(sdName, gcName)
      }

      function matchLocation(
        sdCity?: string,
        sdState?: string,
        sdCountry?: string,
        gcCity?: string,
        gcState?: string,
        gcCountry?: string,
      ): number {
        let score = 0

        if (sdCountry && gcCountry) {
          const sdCountryNorm = normalize(sdCountry)
          const gcCountryNorm = normalize(gcCountry)
          if (sdCountryNorm === gcCountryNorm) {
            score += 40
          } else if (sdCountryNorm.includes(gcCountryNorm) || gcCountryNorm.includes(sdCountryNorm)) {
            score += 20
          }
        }

        if (sdState && gcState) {
          const sdStateNorm = normalize(sdState)
          const gcStateNorm = normalize(gcState)
          if (sdStateNorm === gcStateNorm) {
            score += 35
          } else if (sdStateNorm.includes(gcStateNorm) || gcStateNorm.includes(sdStateNorm)) {
            score += 15
          }
        }

        if (sdCity && gcCity) {
          const sdCityNorm = normalize(sdCity)
          const gcCityNorm = normalize(gcCity)
          if (sdCityNorm === gcCityNorm) {
            score += 25
          }
        }

        return Math.min(score, 100)
      }

      const sportsDataCourseData = {
        name: course.name,
        city: course.city || undefined,
        state: course.stateProvince || undefined,
        country: course.country || undefined,
      }

      // Score all results
      const scoredResults = searchResults.map((gcCourse) => {
        const nameScore = matchCourseName(sportsDataCourseData.name || "", gcCourse.name || "")
        const locationScore = matchLocation(
          sportsDataCourseData.city,
          sportsDataCourseData.state,
          sportsDataCourseData.country,
          gcCourse.city,
          gcCourse.state,
          gcCourse.country,
        )

        const totalScore = nameScore * 0.6 + locationScore * 0.4

        return {
          id: gcCourse.id,
          name: gcCourse.name,
          city: gcCourse.city,
          state: gcCourse.state,
          country: gcCourse.country,
          nameScore,
          locationScore,
          totalScore: Math.round(totalScore),
        }
      })

      // Sort by total score
      scoredResults.sort((a, b) => b.totalScore - a.totalScore)

      let bestMatchResult = undefined
      let noMatchReason = "No results returned from API"
      let finalMatchConfidence = 0
      let finalGolfCourseApiId: number | null = null

      if (searchError) {
        noMatchReason = `API Search Error: ${searchError}`
      } else if (scoredResults.length === 0) {
        noMatchReason = "No courses found in API search results"
      } else {
        const topResult = scoredResults[0]
        if (topResult.totalScore > 50) {
          bestMatchResult = {
            courseId: topResult.id,
            confidence: topResult.totalScore,
            reason: `Name: ${topResult.nameScore}% (60% weight) + Location: ${topResult.locationScore}% (40% weight)`,
          }
          finalMatchConfidence = topResult.totalScore
          finalGolfCourseApiId = topResult.id
          noMatchReason = "MATCH FOUND"
        } else {
          noMatchReason = `Best match score (${topResult.totalScore}%) below 50% threshold`
        }
      }

      diagnostics.push({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        sportsDataIOCourseName: course.name,
        city: course.city || undefined,
        state: course.stateProvince || undefined,
        country: course.country || undefined,
        searchQuery: course.name,
        golfCourseAPIResults: scoredResults,
        bestMatchResult,
        noMatchReason,
        finalMatchConfidence,
        finalGolfCourseApiId,
      })
    }

    // Generate summary
    const matchedCount = diagnostics.filter((d) => d.finalGolfCourseApiId !== null).length
    const failedCount = diagnostics.length - matchedCount

    const rootCauseAnalysis: Record<string, number> = {
      apiSearchErrors: 0,
      noResultsReturned: 0,
      scoresBelow50Threshold: 0,
      missingLocationData: 0,
      poorNameMatches: 0,
    }

    for (const diag of diagnostics) {
      if (diag.noMatchReason.includes("API Search Error")) {
        rootCauseAnalysis.apiSearchErrors++
      } else if (diag.noMatchReason === "No courses found in API search results") {
        rootCauseAnalysis.noResultsReturned++
      } else if (diag.noMatchReason.includes("below 50% threshold")) {
        rootCauseAnalysis.scoresBelow50Threshold++
        if (diag.golfCourseAPIResults.length > 0) {
          const topResult = diag.golfCourseAPIResults[0]
          if (topResult.nameScore < 60) {
            rootCauseAnalysis.poorNameMatches++
          }
          if (topResult.locationScore === 0 && diag.city) {
            rootCauseAnalysis.missingLocationData++
          }
        }
      }
    }

    return NextResponse.json({
      status: "complete",
      totalTournaments: diagnostics.length,
      matchedCount,
      failedCount,
      summary: {
        successRate: `${Math.round((matchedCount / diagnostics.length) * 100)}%`,
        rootCauseAnalysis,
      },
      diagnostics,
    })
  } catch (error) {
    console.error("[v0] Diagnosis error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
