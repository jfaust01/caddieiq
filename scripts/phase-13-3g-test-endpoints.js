#!/usr/bin/env node

const https = require('https');
const url = require('url');

const API_KEY = process.env.GOLFCOURSE_API_KEY;
if (!API_KEY) {
  console.error('ERROR: GOLFCOURSE_API_KEY not set');
  process.exit(1);
}

// Potential endpoint variations to test
const endpoints = [
  'https://api.golfcourseapi.com/v1/courses/search',    // Current (404)
  'https://api.golfcourseapi.com/courses/search',        // No v1
  'https://api.golfcourseapi.com/search',                // Direct search
  'https://api.golfcourseapi.com/v1/search',             // v1 search
  'https://api.golfcourseapi.com/v2/courses/search',     // v2
  'https://api.golfcourseapi.com/api/courses/search',    // api prefix
  'https://courses.golfcourseapi.com/search',            // courses subdomain
  'https://api.golfcourseapi.com/course/search',         // course singular
];

const query = 'Augusta National';

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    try {
      const urlObj = url.parse(endpoint);
      const fullUrl = `${endpoint}?q=${encodeURIComponent(query)}`;
      const urlObj2 = url.parse(fullUrl);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj2.pathname + urlObj2.search,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
        },
        timeout: 5000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            endpoint,
            status: res.statusCode,
            statusText: res.statusMessage,
            contentType: res.headers['content-type'],
            bodyLength: data.length,
            bodyPreview: data.substring(0, 100),
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          endpoint,
          status: 'TIMEOUT',
          error: 'Request timed out',
        });
      });

      req.on('error', (e) => {
        resolve({
          endpoint,
          status: 'ERROR',
          error: e.message,
        });
      });

      req.end();
    } catch (e) {
      resolve({
        endpoint,
        status: 'ERROR',
        error: e.message,
      });
    }
  });
}

async function runTests() {
  console.log('Testing GolfCourseAPI endpoints...\n');
  console.log('Query:', query);
  console.log('='.repeat(80));
  console.log('');

  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  // Display results
  console.log('Results:\n');
  for (const result of results) {
    console.log(`${result.endpoint}`);
    if (result.status === 'ERROR') {
      console.log(`  ERROR: ${result.error}`);
    } else if (result.status === 'TIMEOUT') {
      console.log(`  TIMEOUT`);
    } else {
      console.log(`  Status: ${result.status} ${result.statusText || ''}`);
      console.log(`  Content-Type: ${result.contentType}`);
      console.log(`  Body Length: ${result.bodyLength}`);
      console.log(`  Body Preview: ${result.bodyPreview}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('Summary:');
  const successful = results.filter(r => r.status >= 200 && r.status < 300);
  const notFound = results.filter(r => r.status === 404);
  const errors = results.filter(r => typeof r.status === 'string');

  if (successful.length > 0) {
    console.log(`✅ Successful (2xx): ${successful.length}`);
    for (const r of successful) {
      console.log(`   - ${r.endpoint}`);
    }
  }
  if (notFound.length > 0) {
    console.log(`❌ Not Found (404): ${notFound.length}`);
  }
  if (errors.length > 0) {
    console.log(`⚠️  Errors/Timeouts: ${errors.length}`);
  }
}

runTests().catch(console.error);
