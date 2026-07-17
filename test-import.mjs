#!/usr/bin/env node

/**
 * Test script to run historical import and capture persistence debug output
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('[test-import] Starting historical import test...\n');
  
  try {
    // Run import as a Node script
    const result = await execAsync('node --env-file-if-exists=/vercel/share/.env.project --loader tsx ./lib/imports/historical-results-import.ts', {
      cwd: '/vercel/share/v0-project',
      maxBuffer: 1024 * 1024 * 10,
    });
    
    console.log('[test-import] STDOUT:');
    console.log(result.stdout);
    console.log('\n[test-import] STDERR:');
    console.log(result.stderr);
  } catch (error) {
    console.error('[test-import] Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

main().catch(console.error);
