const https = require('https');

const API_KEY = process.env.GOLFCOURSE_API_KEY;
const BASE_URL = 'https://api.golfcourseapi.com/v1/search';

if (!API_KEY) {
  console.error('ERROR: GOLFCOURSE_API_KEY not set');
  process.exit(1);
}

const testQueries = [
  'Augusta',
  'Pebble Beach',
  'TPC Sawgrass',
];

async function testSearch(query) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL);
    url.searchParams.append('search_query', query);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const courseCount = parsed.courses ? parsed.courses.length : 0;
          const courseNames = parsed.courses ? parsed.courses.map((c) => c.name) : [];
          const courseIds = parsed.courses ? parsed.courses.map((c) => c.id) : [];

          resolve({
            query,
            httpStatus: res.statusCode,
            candidateCount: courseCount,
            returnedCourseNames: courseNames,
            returnedIds: courseIds,
            rawResponse: parsed,
          });
        } catch (e) {
          resolve({
            query,
            httpStatus: res.statusCode,
            candidateCount: 0,
            returnedCourseNames: [],
            returnedIds: [],
            error: 'JSON parse error',
            rawResponse: data,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Phase 13.3I - Correct Parameter Verification Test');
  console.log('='.repeat(70));
  console.log('Testing: search_query parameter (official documentation)');
  console.log('Endpoint: GET /v1/search?search_query={query}');
  console.log('');

  const results = [];

  for (const query of testQueries) {
    console.log(`Testing: "${query}"`);
    try {
      const result = await testSearch(query);
      results.push(result);

      console.log(`  HTTP Status: ${result.httpStatus}`);
      console.log(`  Candidates: ${result.candidateCount}`);

      if (result.candidateCount > 0) {
        console.log(`  Courses: ${result.returnedCourseNames.join(', ')}`);
        console.log(`  IDs: ${result.returnedIds.join(', ')}`);
      }

      console.log('');
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  const successCount = results.filter((r) => r.httpStatus === 200).length;
  const totalCandidates = results.reduce((sum, r) => sum + (r.candidateCount || 0), 0);

  console.log(`Total Queries: ${results.length}`);
  console.log(`HTTP 200 Responses: ${successCount}/${results.length}`);
  console.log(`Total Candidates Retrieved: ${totalCandidates}`);
  console.log('');

  if (totalCandidates > 0) {
    console.log('✅ SUCCESS: Correct parameter returns candidates!');
    console.log('');
    console.log('Detailed Results:');
    results.forEach((r) => {
      console.log(`  "${r.query}": ${r.candidateCount} candidates`);
      if (r.returnedCourseNames.length > 0) {
        r.returnedCourseNames.forEach((name, i) => {
          console.log(`    - ${name} (ID: ${r.returnedIds[i]})`);
        });
      }
    });
  } else {
    console.log('❌ No candidates retrieved');
    console.log('Possible causes:');
    console.log('  1. GolfCourseAPI database is empty');
    console.log('  2. Pro tier needed for course database');
    console.log('  3. Different endpoint needed');
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('Raw JSON Responses:');
  console.log('='.repeat(70));
  results.forEach((r) => {
    console.log(`\n"${r.query}":`);
    console.log(JSON.stringify(r.rawResponse, null, 2));
  });
}

runTests().catch(console.error);
