import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log("MANUAL VERIFICATION TEST: Verify Mapping & Run Import")
  console.log("═══════════════════════════════════════════════════════════════\n")

  try {
    // Step 1: Start dev server
    console.log("STEP 1: Starting dev server...\n")
    const server = exec("npm run dev", { cwd: "/vercel/share/v0-project" })

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // Step 2: Verify a mapping via database query
    console.log("STEP 2: Finding and verifying a high-confidence mapping...\n")

    try {
      const verifyResult = await execAsync(`cd /vercel/share/v0-project && set -a && source /vercel/share/.env.project && set +a && npx tsx << 'SCRIPT'
import { prisma } from "@/lib/db"
import { TournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"

const mappingRepo = new TournamentCourseMappingRepository(prisma)

// Find high-confidence mapping
const mapping = await prisma.tournamentCourseMapping.findFirst({
  where: { matchConfidence: { gte: 50 } },
  orderBy: { matchConfidence: "desc" },
  include: { tournamentCourse: { include: { tournament: true } } },
})

if (!mapping) {
  console.log("NO_MAPPING_FOUND")
  process.exit(0)
}

console.log("FOUND_MAPPING")
console.log(JSON.stringify({
  id: mapping.id,
  tournamentId: mapping.tournamentCourseId,
  tournament: mapping.tournamentCourse.tournament.name,
  course: mapping.tournamentCourseName,
  confidence: mapping.matchConfidence,
  before: { verified: mapping.verified, status: mapping.verificationStatus }
}))

// Verify it
await mappingRepo.verifyMapping(mapping.tournamentCourseId)

// Confirm
const verified = await prisma.tournamentCourseMapping.findUnique({
  where: { id: mapping.id },
})

console.log("VERIFIED_RESULT")
console.log(JSON.stringify({
  verified: verified?.verified,
  status: verified?.verificationStatus,
  autoVerified: verified?.autoVerified
}))

await prisma.$disconnect()
SCRIPT
`)

      const lines = verifyResult.stdout.split("\n")
      let mappingData: any = {}
      let verifiedResult: any = {}

      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "FOUND_MAPPING") {
          mappingData = JSON.parse(lines[i + 1])
          console.log(`✓ Found mapping: ${mappingData.tournament} - ${mappingData.course}`)
          console.log(`  Confidence: ${mappingData.confidence}%`)
          console.log(`  Before: verified=${mappingData.before.verified}, status=${mappingData.before.status}\n`)
        }
        if (lines[i] === "VERIFIED_RESULT") {
          verifiedResult = JSON.parse(lines[i + 1])
          console.log(`✓ After verification:`)
          console.log(`  verified=${verifiedResult.verified}, status=${verifiedResult.status}, autoVerified=${verifiedResult.autoVerified}\n`)
        }
      }

      // Step 3: Call the import endpoint
      console.log("STEP 3: Calling course import endpoint...\n")

      const curlResult = await execAsync(
        `curl -s -X POST http://localhost:3000/api/admin/phase-13-4/run-importer -H "Content-Type: application/json"`,
        { maxBuffer: 10 * 1024 * 1024 }
      )

      const importResponse = JSON.parse(curlResult.stdout)

      console.log(`✓ Import endpoint response:`)
      console.log(`  Status: ${importResponse.status}`)
      console.log(`  Courses considered: ${importResponse.importerResult?.coursesConsidered || "N/A"}`)
      console.log(`  Courses imported: ${importResponse.importerResult?.coursesImported || "N/A"}`)
      console.log(`  Holes imported: ${importResponse.importerResult?.holesImported || "N/A"}`)
      console.log(`  Tee boxes imported: ${importResponse.importerResult?.teeBoxesImported || "N/A"}\n`)

      // Step 4: Check table row counts
      console.log("STEP 4: Checking database table row counts...\n")

      const countResult = await execAsync(`cd /vercel/share/v0-project && set -a && source /vercel/share/.env.project && set +a && npx tsx << 'SCRIPT'
import { prisma } from "@/lib/db"

const counts = {
  courses: await prisma.courses.count(),
  courseDetails: await prisma.courseDetails.count(),
  courseHoles: await prisma.courseHoles.count(),
  courseTees: await prisma.courseTees.count(),
  teeHoleYardages: await prisma.teeHoleYardages.count(),
  courseAddresses: await prisma.courseAddresses.count(),
  courseCoordinates: await prisma.courseCoordinates.count(),
  courseSpecifications: await prisma.courseSpecifications.count(),
  courseMetadata: await prisma.courseMetadata.count(),
  playingConditions: await prisma.playingConditions.count(),
}

console.log(JSON.stringify(counts))
await prisma.$disconnect()
SCRIPT
`)

      const tableCounts = JSON.parse(countResult.stdout.split("\n").find((l) => l.startsWith("{")) || "{}")

      console.log(`✓ Course tables populated:`)
      for (const [table, count] of Object.entries(tableCounts)) {
        if ((count as number) > 0) {
          console.log(`  ${table}: ${count} rows`)
        }
      }
      console.log("")

      // Summary
      console.log("═══════════════════════════════════════════════════════════════")
      console.log("TEST RESULTS SUMMARY")
      console.log("═══════════════════════════════════════════════════════════════\n")

      console.log(`✓ Was mapping selected? ${importResponse.importerResult?.coursesConsidered ? "YES" : "NO"}`)
      console.log(`✓ Did course import execute? ${importResponse.importerResult?.coursesImported ? "YES" : "NO"}`)
      console.log(`✓ Which tables received rows?`)
      for (const [table, count] of Object.entries(tableCounts)) {
        if ((count as number) > 0) {
          console.log(`  - ${table}: ${count}`)
        }
      }
      console.log(`✓ Any downstream errors? ${importResponse.importerResult?.failures?.length ? "YES" : "NO"}`)
      if (importResponse.importerResult?.failures?.length) {
        for (const failure of importResponse.importerResult.failures) {
          console.log(`  - ${failure}`)
        }
      }
      console.log("")

      console.log("═══════════════════════════════════════════════════════════════\n")
    } finally {
      server.kill()
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
