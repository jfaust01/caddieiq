#!/usr/bin/env node

/**
 * Phase 13.3G - Capture Raw GolfCourseAPI Responses
 * 
 * Purpose: Capture exact HTTP transaction without transformation
 * - Request: URL, method, parameters, headers
 * - Response: Status, all headers, raw body
 */

const https = require('https');
const url = require('url');

const API_KEY = process.env.GOLFCOURSE_API_KEY;
if (!API_KEY) {
  console.error('ERROR: GOLFCOURSE_API_KEY not set');
  process.exit(1);
}

// REQUEST DETAILS
const query = 'Augusta National';
const requestUrl = new URL('https://api.golfcourseapi.com/v1/courses/search');
requestUrl.searchParams.append('q', query);

const urlObj = url.parse(requestUrl.toString());

console.log('==================================================');
console.log('REQUEST');
console.log('==================================================');
console.log('URL:', requestUrl.toString());
console.log('Method: GET');
console.log('Query Parameters:');
console.log('  q =', query);
console.log('Headers:');
console.log('  Authorization: Bearer [REDACTED]');
console.log('  Accept: application/json');
console.log('');

// Make request
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port,
  path: urlObj.pathname + urlObj.search,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json',
  },
};

const req = https.request(options, (res) => {
  console.log('==================================================');
  console.log('RESPONSE');
  console.log('==================================================');
  console.log('HTTP Status:', res.statusCode, res.statusMessage);
  console.log('');
  console.log('Response Headers:');
  
  // Print all headers exactly as received
  const headerNames = Object.keys(res.headers).sort();
  for (const headerName of headerNames) {
    const headerValue = res.headers[headerName];
    console.log(`  ${headerName}: ${headerValue}`);
  }
  console.log('');
  console.log('Response Body (Raw):');
  console.log('==================================================');
  
  let rawData = '';
  
  res.on('data', (chunk) => {
    rawData += chunk;
  });
  
  res.on('end', () => {
    // Print raw body exactly as received (no parsing, no transformation)
    console.log(rawData);
    console.log('==================================================');
    
    // Attempt to identify content type
    const contentType = res.headers['content-type'] || 'unknown';
    if (contentType.includes('application/json')) {
      console.log('');
      console.log('Content-Type: application/json');
      
      // Try to parse and pretty-print for reference (but show raw first)
      try {
        const parsed = JSON.parse(rawData);
        console.log('Parsed JSON (for reference):');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('JSON Parse Error:');
        console.log(`  ${e.message}`);
        console.log('Raw body printed above.');
      }
    }
  });
});

req.on('error', (e) => {
  console.log('==================================================');
  console.log('REQUEST ERROR');
  console.log('==================================================');
  console.log('Exception Type:', e.constructor.name);
  console.log('Message:', e.message);
  console.log('Stack:');
  console.log(e.stack);
  process.exit(1);
});

req.end();
