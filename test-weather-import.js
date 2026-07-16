// Direct test script for weather import pipeline
// Run with: node test-weather-import.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.development.local') });

async function testWeatherImport() {
  console.log('[v0] WEATHER IMPORT END-TO-END TEST');
  console.log('[v0] Environment check:');
  console.log('[v0] - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
  console.log('[v0] - OPENWEATHER_API_KEY:', process.env.OPENWEATHER_API_KEY ? 'SET' : 'MISSING');
  
  try {
    // Load modules
    console.log('[v0] Loading modules...');
    const { PrismaClient } = require('@prisma/client');
    const { importWeather } = require('./lib/imports/weather-import');
    
    console.log('[v0] Modules loaded successfully');
    
    // Initialize Prisma
    const prisma = new PrismaClient();
    
    console.log('[v0] Testing database connection...');
    const tournaments = await prisma.tournament.findMany({
      where: { deletedAt: null, status: { not: 'CANCELED' } },
      select: { id: true, name: true, startDate: true },
      take: 5,
    });
    
    console.log('[v0] Database connection successful');
    console.log('[v0] Tournaments found:', tournaments.length);
    tournaments.forEach((t) => {
      console.log(`  - ${t.name} (${t.startDate?.toISOString().slice(0, 10) || 'no date'})`);
    });
    
    if (tournaments.length === 0) {
      console.log('[v0] No tournaments in database - import will find nothing');
    }
    
    // Run import
    console.log('[v0]');
    console.log('[v0] Running weather import...');
    console.log('[v0]');
    
    const summary = await importWeather({
      prisma,
      // Don't pass tournamentIds - let it auto-select
    });
    
    console.log('[v0]');
    console.log('[v0] Import complete');
    console.log('[v0] Summary:', summary);
    
    // Check database state
    console.log('[v0]');
    console.log('[v0] Checking database state...');
    const logCount = await prisma.weatherImportLog.count();
    const snapshotCount = await prisma.weatherSnapshot.count();
    const periodCount = await prisma.weatherPeriod.count();
    
    console.log('[v0] WeatherImportLog rows:', logCount);
    console.log('[v0] WeatherSnapshot rows:', snapshotCount);
    console.log('[v0] WeatherPeriod rows:', periodCount);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('[v0] Error:', error);
    process.exit(1);
  }
}

testWeatherImport();
