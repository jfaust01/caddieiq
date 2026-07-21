import { SportsDataIOHistoricalImporter } from '@/lib/imports/connectors/sportsdataio-historical-importer';
import prismaClient from '@/lib/prisma';

async function executeRealImport() {
  const importer = new SportsDataIOHistoricalImporter({
    prisma: prismaClient,
  });

  console.log('[v0] === PHASE 17.3C.3 STEP 3: REAL IMPORT ===\n');
  console.log('Tournament Selection: The Open (ID: 692)');
  console.log('Mode: REAL_IMPORT (with persistence)\n');

  try {
    // Get before counts
    console.log('--- BEFORE COUNTS ---');
    const beforeTournaments = await prismaClient.tournament.count();
    const beforeCourses = await prismaClient.course.count();
    const beforePlayers = await prismaClient.player.count();
    const beforeRounds = await prismaClient.round.count();
    const beforePlayerRounds = await prismaClient.playerRound.count();
    const beforeTournamentFields = await prismaClient.tournamentField.count();

    console.log('Tournaments:', beforeTournaments);
    console.log('Courses:', beforeCourses);
    console.log('Players:', beforePlayers);
    console.log('Rounds:', beforeRounds);
    console.log('Player Rounds:', beforePlayerRounds);
    console.log('Tournament Fields:', beforeTournamentFields);
    console.log('');

    // Execute full import
    console.log('--- FETCH ---');
    const startFetch = new Date();
    const rawRecords = await importer.fetch({
      tournamentId: 692,
    });
    const endFetch = new Date();
    console.log('Duration:', endFetch.getTime() - startFetch.getTime(), 'ms');
    console.log('Raw records fetched:', rawRecords.length);
    console.log('');

    console.log('--- NORMALIZE ---');
    const startNormalize = new Date();
    const normalized = importer.normalize(rawRecords);
    const endNormalize = new Date();
    console.log('Duration:', endNormalize.getTime() - startNormalize.getTime(), 'ms');
    console.log('Normalized records:', normalized.length);
    console.log('');

    console.log('--- VALIDATE ---');
    const startValidate = new Date();
    const validation = await importer.validate(normalized);
    const endValidate = new Date();
    console.log('Duration:', endValidate.getTime() - startValidate.getTime(), 'ms');
    console.log('Valid records:', validation.valid.length);
    console.log('Rejected records:', validation.rejected.length);
    console.log('Is healthy:', validation.isHealthy);
    console.log('');

    console.log('--- PERSIST ---');
    const startPersist = new Date();
    const persist = await importer.persist(validation.valid, 'import-' + Date.now());
    const endPersist = new Date();
    console.log('Duration:', endPersist.getTime() - startPersist.getTime(), 'ms');
    console.log('Inserted:', persist.inserted);
    console.log('Updated:', persist.updated);
    console.log('');

    // Get after counts
    console.log('--- AFTER COUNTS ---');
    const afterTournaments = await prismaClient.tournament.count();
    const afterCourses = await prismaClient.course.count();
    const afterPlayers = await prismaClient.player.count();
    const afterRounds = await prismaClient.round.count();
    const afterPlayerRounds = await prismaClient.playerRound.count();
    const afterTournamentFields = await prismaClient.tournamentField.count();

    console.log('Tournaments:', afterTournaments, '(before: ' + beforeTournaments + ', diff: ' + (afterTournaments - beforeTournaments) + ')');
    console.log('Courses:', afterCourses, '(before: ' + beforeCourses + ', diff: ' + (afterCourses - beforeCourses) + ')');
    console.log('Players:', afterPlayers, '(before: ' + beforePlayers + ', diff: ' + (afterPlayers - beforePlayers) + ')');
    console.log('Rounds:', afterRounds, '(before: ' + beforeRounds + ', diff: ' + (afterRounds - beforeRounds) + ')');
    console.log('Player Rounds:', afterPlayerRounds, '(before: ' + beforePlayerRounds + ', diff: ' + (afterPlayerRounds - beforePlayerRounds) + ')');
    console.log('Tournament Fields:', afterTournamentFields, '(before: ' + beforeTournamentFields + ', diff: ' + (afterTournamentFields - beforeTournamentFields) + ')');
    console.log('');

    console.log('--- REAL IMPORT SUMMARY ---');
    console.log('Import job ID: import-' + Date.now());
    console.log('Fetched count:', rawRecords.length);
    console.log('Normalized count:', normalized.length);
    console.log('Valid count:', validation.valid.length);
    console.log('Rejected count:', validation.rejected.length);
    console.log('Inserted records:', persist.inserted);
    console.log('Updated records:', persist.updated);
    console.log('Total duration: ' + (endPersist.getTime() - startFetch.getTime()) + 'ms');
    console.log('');
    console.log('Status: REAL_IMPORT_COMPLETE');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

executeRealImport();
