const https = require('https');

const API_KEY = process.env.GOLFCOURSE_API_KEY;
const baseUrl = 'https://api.golfcourseapi.com/v1';

if (!API_KEY) {
  console.error('ERROR: GOLFCOURSE_API_KEY not set');
  process.exit(1);
}

// Test different parameter names and values
const tests = [
  { name: 'query param q', params: { q: 'Augusta' } },
  { name: 'query param query', params: { query: 'Augusta' } },
  { name: 'query param search', params: { search: 'Augusta' } },
  { name: 'query param name', params: { name: 'Augusta' } },
  { name: 'query param courseName', params: { courseName: 'Augusta' } },
  { name: 'POST with JSON body', method: 'POST', body: { q: 'Augusta' } },
  { name: 'POST with query param', method: 'POST', params: { q: 'Augusta' } },
  { name: 'GET with empty query', params: { q: '' } },
  { name: 'GET courses endpoint', endpoint: '/courses', params: { q: 'Augusta' } },
  { name: 'GET /v1/courses endpoint', endpoint: '/courses', params: { q: 'Augusta' } },
];

async function testVariant(test) {
  return new Promise((resolve, reject) => {
    const endpoint = test.endpoint || '/search';
    const method = test.method || 'GET';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (test.params) {
      Object.entries(test.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          test: test.name,
          endpoint: endpoint,
          method: method,
          httpStatus: res.statusCode,
          contentType: res.headers['content-type'],
          bodyPreview: data.substring(0, 150),
          success: res.statusCode === 200,
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        test: test.name,
        endpoint: endpoint,
        method: method,
        httpStatus: 0,
        error: e.message,
        success: false,
      });
    });

    if (test.body) {
      req.write(JSON.stringify(test.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Phase 13.3H — Search Parameter Variants Test');
  console.log('='.repeat(80));
  console.log('');

  const results = [];

  for (const test of tests) {
    const result = await testVariant(test);
    results.push(result);
    
    console.log(`Test: ${result.test}`);
    console.log(`  Endpoint: ${result.endpoint}`);
    console.log(`  Method: ${result.method}`);
    console.log(`  HTTP Status: ${result.httpStatus}`);
    console.log(`  Success: ${result.success ? '✅' : '❌'}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else {
      console.log(`  Body Preview: ${result.bodyPreview}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success);
  console.log(`Successful: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('');
    console.log('Working variants:');
    for (const r of successful) {
      console.log(`  ✅ ${r.test}`);
    }
  }
  
  // Check rate limiting
  const rateLimited = results.filter(r => r.httpStatus === 429);
  if (rateLimited.length > 0) {
    console.log('');
    console.log('Rate limited requests:');
    for (const r of rateLimited) {
      console.log(`  ⚠️ ${r.test}`);
    }
  }

  console.log('');
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch(console.error);
