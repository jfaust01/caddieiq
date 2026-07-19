import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"
import { findBestMatch } from "@/lib/domain/course/matcher"

const API_KEY = process.env.GOLFCOURSE_API_KEY
if (!API_KEY) {
  console.error("ERROR: GOLFCOURSE_API_KEY not set")
  process.exit(1)
}

// All 43 tournament courses from the system
const tournamentCourses = [
  { tournament: "2018 Masters Tournament", courseName: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "USA" },
  { tournament: "2019 Masters Tournament", courseName: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "USA" },
  { tournament: "2020 Masters Tournament", courseName: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "USA" },
  { tournament: "2021 Masters Tournament", courseName: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "USA" },
  { tournament: "Biltmore Championship Asheville", courseName: "Biltmore Forest Country Club", city: "Asheville", state: "NC", country: "USA" },
  { tournament: "Black Desert Championship", courseName: "Black Desert Resort", city: "Ivins", state: "UT", country: "USA" },
  { tournament: "Cadillac Championship", courseName: "Doral Golf Resort & Spa", city: "Doral", state: "FL", country: "USA" },
  { tournament: "CareerBuilder Challenge", courseName: "La Quinta CC", city: "La Quinta", state: "CA", country: "USA" },
  { tournament: "Cognizant Classic in The Palm Beaches", courseName: "PGA National Resort & Spa", city: "Palm Beach Gardens", state: "FL", country: "USA" },
  { tournament: "Crowne Plaza Invitational at Colonial", courseName: "Colonial Country Club", city: "Fort Worth", state: "TX", country: "USA" },
  { tournament: "CVS Health Charity Classic", courseName: "Rhode Island Country Club", city: "Barrington", state: "RI", country: "USA" },
  { tournament: "Desert Classic", courseName: "Stadium Course", city: "La Quinta", state: "CA", country: "USA" },
  { tournament: "Fort Worth Invitational", courseName: "Colonial Country Club", city: "Fort Worth", state: "TX", country: "USA" },
  { tournament: "Franklin Templeton Shootout", courseName: "Tiburon Golf Club", city: "Naples", state: "FL", country: "USA" },
  { tournament: "Good Good Championship", courseName: "Firekeeper's Casino Hotel Golf Course", city: "Battle Creek", state: "MI", country: "USA" },
  { tournament: "Humana Challenge", courseName: "La Quinta Country Club", city: "La Quinta", state: "CA", country: "USA" },
  { tournament: "ISPS HANDA Melbourne World Cup of Golf", courseName: "Metropolitan Golf Club", city: "Melbourne", state: "VIC", country: "Australia" },
  { tournament: "ISPS HANDA World Cup of Golf", courseName: "Kingston Heath Golf Club", city: "Cheltenham", state: "VIC", country: "Australia" },
  { tournament: "Mexico City Championship", courseName: "Club de Golf Chapultepec", city: "Mexico City", state: "", country: "Mexico" },
  { tournament: "MGM Resorts The Challenge: Japan Skins", courseName: "Accordia Golf Narashino", city: "Narashino", state: "", country: "Japan" },
  { tournament: "Military Tribute at The Greenbrier", courseName: "The Greenbrier Resort (Old White TPC)", city: "White Sulphur Springs", state: "WV", country: "USA" },
  { tournament: "Myrtle Beach Golf Classic", courseName: "Dunes Golf Club", city: "Myrtle Beach", state: "SC", country: "USA" },
  { tournament: "Pebble Beach Pro-Am", courseName: "Spyglass Hill Golf Club", city: "Pebble Beach", state: "CA", country: "USA" },
  { tournament: "Phoenix Open", courseName: "TPC Scottsdale", city: "Scottsdale", state: "AZ", country: "USA" },
  { tournament: "Players Championship", courseName: "TPC Sawgrass", city: "Ponte Vedra Beach", state: "FL", country: "USA" },
  { tournament: "Puerto Rico Open", courseName: "Grand Reserve Country Club", city: "Rio Grande", state: "", country: "Puerto Rico" },
  { tournament: "RBC Heritage", courseName: "Harbour Town Golf Links", city: "Hilton Head Island", state: "SC", country: "USA" },
  { tournament: "Rocket Mortgage Classic", courseName: "Detroit Golf Club", city: "Detroit", state: "MI", country: "USA" },
  { tournament: "Safeway Open", courseName: "Silverado Resort", city: "Napa", state: "CA", country: "USA" },
  { tournament: "Sanderson Farms Championship", courseName: "Mississippi National Golf Club", city: "Madison", state: "MS", country: "USA" },
  { tournament: "Shriners Hospitals for Children Open", courseName: "TPC Summerlin", city: "Las Vegas", state: "NV", country: "USA" },
  { tournament: "Sony Open in Hawaii", courseName: "Waialae Country Club", city: "Honolulu", state: "HI", country: "USA" },
  { tournament: "The CJ Cup Byron Nelson", courseName: "Trinity Forest Golf Club", city: "Dallas", state: "TX", country: "USA" },
  { tournament: "The Open Championship", courseName: "Various UK Courses", city: "", state: "", country: "UK" },
  { tournament: "The Presidents Cup", courseName: "Various International Courses", city: "", state: "", country: "International" },
  { tournament: "The Ritz-Carlton Golf Club", courseName: "The Ritz-Carlton Golf Club", city: "Naples", state: "FL", country: "USA" },
  { tournament: "Tire Pros Open", courseName: "Ashton Ranch Golf Club", city: "Superstition Mountain", state: "AZ", country: "USA" },
  { tournament: "Troon Golf Las Vegas", courseName: "Troon Las Vegas Golf Club", city: "Las Vegas", state: "NV", country: "USA" },
  { tournament: "Troon Golf Scottsdale", courseName: "Troon Scottsdale Golf Club", city: "Scottsdale", state: "AZ", country: "USA" },
  { tournament: "Tripadvisor Swing Fore Good", courseName: "Disney Golf", city: "Lake Buena Vista", state: "FL", country: "USA" },
  { tournament: "U.S. Bank Championship", courseName: "TPC Twin Cities", city: "Blaine", state: "MN", country: "USA" },
  { tournament: "Victor Hovland Heroes Challenge", courseName: "Mayakoba Golf Club", city: "Playa del Carmen", state: "", country: "Mexico" },
  { tournament: "Travelers Championship", courseName: "TPC River Highlands", city: "Cromwell", state: "CT", country: "USA" },
  { tournament: "Wyndham Championship", courseName: "Sedgefield Country Club", city: "Greensboro", state: "NC", country: "USA" },
]

async function analyzeMatching() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════════════╗")
  console.log("║                 DETAILED TOURNAMENT SCORING ANALYSIS                          ║")
  console.log("║                    Below 80% Confidence Breakdown                             ║")
  console.log("╚════════════════════════════════════════════════════════════════════════════════╝\n")

  const client = new GolfCourseAPIClient(API_KEY)
  let belowCount = 0

  for (const tc of tournamentCourses) {
    try {
      // Search GolfCourseAPI
      const candidates = await client.searchCourses(tc.courseName)

      if (!candidates || candidates.length === 0) {
        belowCount++
        console.log(`📍 ${tc.tournament}`)
        console.log(`   Original: ${tc.courseName}`)
        console.log(`   Location: ${tc.city}, ${tc.state}, ${tc.country}`)
        console.log(`   Candidates Found: 0`)
        console.log(`   Confidence: 0%`)
        console.log(`   Status: NO MATCH IN DATABASE\n`)
        continue
      }

      // Score each candidate using the matcher
      const courseData = {
        name: tc.courseName,
        city: tc.city,
        state: tc.state,
        country: tc.country,
      }

      const bestMatch = findBestMatch(
        courseData,
        candidates.map((c) => ({
          id: c.id,
          name: c.course_name,
          clubName: c.club_name,
          city: c.location?.city,
          state: c.location?.state,
          country: c.location?.country,
        })),
      )

      if (!bestMatch || bestMatch.confidence < 80) {
        belowCount++

        const confidence = bestMatch?.confidence || 0
        console.log(`📍 ${tc.tournament}`)
        console.log(`   Original: ${tc.courseName}`)
        console.log(`   Location: ${tc.city}, ${tc.state}, ${tc.country}`)
        console.log(`   Candidates Found: ${candidates.length}`)
        if (bestMatch) {
          console.log(`   Best Match: ${candidates[candidates.findIndex((c) => c.id === bestMatch.courseId)]?.course_name}`)
          console.log(`   Best Match Location: ${candidates[candidates.findIndex((c) => c.id === bestMatch.courseId)]?.location?.city}, ${candidates[candidates.findIndex((c) => c.id === bestMatch.courseId)]?.location?.state}`)
        }
        console.log(`   Confidence: ${confidence}%`)
        console.log(`   Status: ${confidence === 0 ? "NO CANDIDATES" : "LOW CONFIDENCE"}\n`)
      }
    } catch (error) {
      console.error(`ERROR processing ${tc.tournament}:`, error)
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════════════════════`)
  console.log(`SUMMARY: ${belowCount} tournaments below 80% confidence`)
  console.log(`═══════════════════════════════════════════════════════════════════════════════\n`)
}

analyzeMatching().catch(console.error)
