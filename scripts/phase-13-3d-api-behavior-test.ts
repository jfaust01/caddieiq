/**
 * Phase 13.3D — Verify GolfCourseAPI Search Behavior
 * 
 * Run controlled experiments against 5 well-known golf courses.
 * Test whether GolfCourseAPI requires location information.
 * 
 * NO CODE MODIFICATIONS - Testing only
 * NO DATABASE CHANGES - Testing only
 */

import fetch from 'node-fetch'

interface TestCourse {
  name: string
  simplifiedName: string
  city: string
  state: string
  country: string
}

interface SearchTest {
  course: string
  searchType: string
  query: string
  candidatesReturned: number
  candidates: any[]
  rawResponse: any
  success: boolean
  error?: string
}

// Test courses
const TEST_COURSES: TestCourse[] = [
  {
    name: 'Augusta National Golf Club',
    simplifiedName: 'Augusta National',
    city: 'Augusta',
    state: 'Georgia',
    country: 'USA',
  },
  {
    name: 'Pebble Beach Golf Links',
    simplifiedName: 'Pebble Beach',
    city: 'Pebble Beach',
    state: 'California',
    country: 'USA',
  },
  {
    name: 'TPC Sawgrass',
    simplifiedName: 'TPC Sawgrass',
    city: 'Ponte Vedra Beach',
    state: 'Florida',
    country: 'USA',
  },
  {
    name: 'St Andrews Old Course',
    simplifiedName: 'St Andrews',
    city: 'St Andrews',
    state: 'Fife',
    country: 'Scotland',
  },
  {
    name: 'Pinehurst No. 2',
    simplifiedName: 'Pinehurst',
    city: 'Pinehurst',
    state: 'North Carolina',
    country: 'USA',
  },
]

/**
 * Make API request to GolfCourseAPI
 */
async function searchAPI(query: string): Promise<{ success: boolean; data: any; response: any }> {
  try {
    const apiKey = process.env.GOLFCOURSE_API_KEY
    if (!apiKey) {
      throw new Error('GOLFCOURSE_API_KEY not set')
    }

    const url = `https://api.golfcourseapi.com/v1/courses/search?q=${encodeURIComponent(query)}`
    
    console.log(`[v0] API Request: GET ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch {
      data = responseText
    }

    console.log(`[v0] API Response Status: ${response.status}`)
    console.log(`[v0] API Response Body: ${JSON.stringify(data).substring(0, 300)}...`)

    if (!response.ok) {
      return {
        success: false,
        data: null,
        response: {
          status: response.status,
          statusText: response.statusText,
          body: data,
        },
      }
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : data?.data || [],
      response: {
        status: response.status,
        statusText: response.statusText,
        body: data,
      },
    }
  } catch (error) {
    console.error(`[v0] API Error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      data: null,
      response: {
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

/**
 * Test 1: Exact SportsDataIO course name only
 */
async function test1ExactNameOnly(course: TestCourse): Promise<SearchTest> {
  console.log(`\n[v0] TEST 1: Exact name only`)
  console.log(`[v0] Course: ${course.name}`)

  const { success, data, response } = await searchAPI(course.name)

  return {
    course: course.name,
    searchType: 'Exact Name Only',
    query: course.name,
    candidatesReturned: success && Array.isArray(data) ? data.length : 0,
    candidates: success && Array.isArray(data) ? data : [],
    rawResponse: response,
    success,
  }
}

/**
 * Test 2: Simplified course name
 */
async function test2SimplifiedName(course: TestCourse): Promise<SearchTest> {
  console.log(`\n[v0] TEST 2: Simplified name`)
  console.log(`[v0] Course: ${course.simplifiedName}`)

  const { success, data, response } = await searchAPI(course.simplifiedName)

  return {
    course: course.name,
    searchType: 'Simplified Name',
    query: course.simplifiedName,
    candidatesReturned: success && Array.isArray(data) ? data.length : 0,
    candidates: success && Array.isArray(data) ? data : [],
    rawResponse: response,
    success,
  }
}

/**
 * Test 3: Course name + location
 */
async function test3NamePlusLocation(course: TestCourse): Promise<SearchTest> {
  console.log(`\n[v0] TEST 3: Name + location`)
  const query = `${course.name} ${course.city} ${course.state} ${course.country}`
  console.log(`[v0] Query: ${query}`)

  const { success, data, response } = await searchAPI(query)

  return {
    course: course.name,
    searchType: 'Name + Location',
    query,
    candidatesReturned: success && Array.isArray(data) ? data.length : 0,
    candidates: success && Array.isArray(data) ? data : [],
    rawResponse: response,
    success,
  }
}

/**
 * Run all tests for one course
 */
async function testCourse(course: TestCourse): Promise<SearchTest[]> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Testing: ${course.name}`)
  console.log(`Location: ${course.city}, ${course.state}, ${course.country}`)
  console.log(`${'='.repeat(60)}`)

  const results: SearchTest[] = []

  try {
    const test1 = await test1ExactNameOnly(course)
    results.push(test1)
    await delay(1000) // Rate limit
  } catch (error) {
    console.error('[v0] Test 1 failed:', error)
  }

  try {
    const test2 = await test2SimplifiedName(course)
    results.push(test2)
    await delay(1000) // Rate limit
  } catch (error) {
    console.error('[v0] Test 2 failed:', error)
  }

  try {
    const test3 = await test3NamePlusLocation(course)
    results.push(test3)
    await delay(1000) // Rate limit
  } catch (error) {
    console.error('[v0] Test 3 failed:', error)
  }

  return results
}

/**
 * Delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  Phase 13.3D — Verify GolfCourseAPI Search Behavior        ║')
  console.log('║  Testing whether location information is required          ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  const allResults: SearchTest[] = []

  for (const course of TEST_COURSES) {
    try {
      const courseResults = await testCourse(course)
      allResults.push(...courseResults)
    } catch (error) {
      console.error(`[v0] Failed to test course ${course.name}:`, error)
    }
    await delay(1000) // Rate limit between courses
  }

  // Generate comparison table
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  COMPARISON TABLE                                          ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // Group by course
  const courseGroups = new Map<string, SearchTest[]>()
  for (const result of allResults) {
    if (!courseGroups.has(result.course)) {
      courseGroups.set(result.course, [])
    }
    courseGroups.get(result.course)!.push(result)
  }

  // Print comparison
  for (const [course, results] of courseGroups) {
    console.log(`\n${course}`)
    console.log('-'.repeat(60))
    console.log('Search Type          | Query                          | Candidates | Success')
    console.log('-'.repeat(60))
    
    for (const result of results) {
      const searchType = result.searchType.padEnd(20)
      const query = result.query.substring(0, 28).padEnd(30)
      const candidates = String(result.candidatesReturned).padEnd(11)
      const success = result.success ? '✓' : '✗'
      console.log(`${searchType} | ${query} | ${candidates} | ${success}`)
    }
  }

  // Analysis
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  ANALYSIS                                                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // Count successes
  const nameOnlyResults = allResults.filter(r => r.searchType === 'Exact Name Only')
  const simplifiedResults = allResults.filter(r => r.searchType === 'Simplified Name')
  const nameLocationResults = allResults.filter(r => r.searchType === 'Name + Location')

  const nameOnlyWithCandidates = nameOnlyResults.filter(r => r.candidatesReturned > 0).length
  const simplifiedWithCandidates = simplifiedResults.filter(r => r.candidatesReturned > 0).length
  const nameLocationWithCandidates = nameLocationResults.filter(r => r.candidatesReturned > 0).length

  console.log(`Test 1 (Exact Name Only):`)
  console.log(`  - Tested: ${nameOnlyResults.length}`)
  console.log(`  - With Candidates: ${nameOnlyWithCandidates}`)
  console.log(`  - Success Rate: ${nameOnlyResults.length > 0 ? ((nameOnlyWithCandidates / nameOnlyResults.length) * 100).toFixed(0) : 0}%\n`)

  console.log(`Test 2 (Simplified Name):`)
  console.log(`  - Tested: ${simplifiedResults.length}`)
  console.log(`  - With Candidates: ${simplifiedWithCandidates}`)
  console.log(`  - Success Rate: ${simplifiedResults.length > 0 ? ((simplifiedWithCandidates / simplifiedResults.length) * 100).toFixed(0) : 0}%\n`)

  console.log(`Test 3 (Name + Location):`)
  console.log(`  - Tested: ${nameLocationResults.length}`)
  console.log(`  - With Candidates: ${nameLocationWithCandidates}`)
  console.log(`  - Success Rate: ${nameLocationResults.length > 0 ? ((nameLocationWithCandidates / nameLocationResults.length) * 100).toFixed(0) : 0}%\n`)

  // Determine hypothesis
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║  DETERMINATION                                             ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  if (nameOnlyWithCandidates === nameOnlyResults.length) {
    console.log('✓ OPTION A: GolfCourseAPI successfully finds courses without location')
    console.log('  Conclusion: Missing location is NOT the primary blocker')
  } else if (nameLocationWithCandidates > nameOnlyWithCandidates) {
    console.log('✓ OPTION B: GolfCourseAPI returns better results WITH location')
    console.log('  Conclusion: Missing location IS contributing to failures')
  } else if (nameOnlyWithCandidates === 0 && nameLocationWithCandidates === 0) {
    console.log('⚠ OPTION C: Search query construction may be incorrect')
    console.log('  Conclusion: Even with location, no candidates returned')
  } else {
    console.log('? OPTION D: GolfCourseAPI behavior is different than expected')
    console.log('  Conclusion: Requires further investigation')
  }

  // Output raw results as JSON
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  RAW RESULTS (JSON)                                        ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const outputData = {
    timestamp: new Date().toISOString(),
    testCourses: TEST_COURSES.length,
    totalTests: allResults.length,
    results: allResults.map(r => ({
      course: r.course,
      searchType: r.searchType,
      query: r.query,
      candidatesReturned: r.candidatesReturned,
      candidates: r.candidates.slice(0, 3), // Top 3
      success: r.success,
      error: r.error,
    })),
    summary: {
      nameOnlySuccess: `${nameOnlyWithCandidates}/${nameOnlyResults.length}`,
      simplifiedSuccess: `${simplifiedWithCandidates}/${simplifiedResults.length}`,
      nameLocationSuccess: `${nameLocationWithCandidates}/${nameLocationResults.length}`,
    },
  }

  console.log(JSON.stringify(outputData, null, 2))
}

// Execute
main().catch(error => {
  console.error('[v0] Fatal error:', error)
  process.exit(1)
})
