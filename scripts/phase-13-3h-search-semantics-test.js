const https = require('https');

const API_KEY = process.env.GOLFCOURSE_API_KEY;
const baseUrl = 'https://api.golfcourseapi.com/v1';

if (!API_KEY) {
  console.error('ERROR: GOLFCOURSE_API_KEY not set');
  process.exit(1);
}

// Test queries
const queries = [
  'Augusta',
  'Augusta National',
  'Augusta National Golf Club',
  'Pebble',
  'Pebble Beach',
  'TPC Sawgrass',
  'Sawgrass',
  'St Andrews',
  'Pinehurst',
];

const results = [];

async function testQuery(query) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/search`);
    url.searchParams.append('q', query);

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
          const courses = parsed.courses || [];
          
          resolve({
            query,
            httpStatus: res.statusCode,
            candidateCount: courses.length,
            courses: courses.map(c => ({
              id: c.id,
              name: c.name,
              city: c.city,
              state: c.state,
              country: c.country,
              courseType: c.courseType,
            })),
          });
        } catch (e) {
          resolve({
            query,
            httpStatus: res.statusCode,
            candidateCount: 0,
            error: 'JSON Parse Error: ' + e.message,
            rawData: data.substring(0, 200),
            courses: [],
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        query,
        httpStatus: 0,
        candidateCount: 0,
        error: 'Network Error: ' + e.message,
        courses: [],
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Phase 13.3H — GolfCourseAPI Search Semantics Test');
  console.log('='.repeat(80));
  console.log('');

  for (const query of queries) {
    const result = await testQuery(query);
    results.push(result);
    
    console.log(`Query: "${query}"`);
    console.log(`  HTTP Status: ${result.httpStatus}`);
    console.log(`  Candidates: ${result.candidateCount}`);
    
    if (result.candidateCount > 0) {
      console.log(`  Courses:`);
      for (const course of result.courses) {
        console.log(`    - ${course.name} (ID: ${course.id})`);
        console.log(`      Location: ${course.city}, ${course.state}, ${course.country}`);
        console.log(`      Type: ${course.courseType || 'N/A'}`);
      }
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const withResults = results.filter(r => r.candidateCount > 0);
  const empty = results.filter(r => r.candidateCount === 0);
  const errors = results.filter(r => r.error);

  console.log(`Total Queries: ${results.length}`);
  console.log(`With Results: ${withResults.length}`);
  console.log(`Empty Results: ${empty.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log('');

  if (withResults.length > 0) {
    console.log('QUERIES WITH RESULTS:');
    for (const r of withResults) {
      console.log(`  "${r.query}" → ${r.candidateCount} candidates`);
    }
    console.log('');
    
    // Show all unique candidates
    const allCandidates = new Set();
    for (const r of withResults) {
      for (const course of r.courses) {
        allCandidates.add(JSON.stringify({
          id: course.id,
          name: course.name,
          location: `${course.city}, ${course.state}`,
        }));
      }
    }
    
    console.log(`UNIQUE CANDIDATES FOUND: ${allCandidates.size}`);
    for (const candidate of allCandidates) {
      const parsed = JSON.parse(candidate);
      console.log(`  ${parsed.name} (ID: ${parsed.id}) - ${parsed.location}`);
    }
  }

  if (empty.length > 0) {
    console.log('');
    console.log('QUERIES WITH NO RESULTS:');
    for (const r of empty) {
      console.log(`  "${r.query}" → 0 candidates`);
    }
  }

  // Output JSON for detailed analysis
  console.log('');
  console.log('='.repeat(80));
  console.log('DETAILED JSON OUTPUT');
  console.log('='.repeat(80));
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch(console.error);
