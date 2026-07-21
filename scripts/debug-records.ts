import { SportsDataIOHistoricalImporter } from '@/lib/imports/connectors/sportsdataio-historical-importer';
import prismaClient from '@/lib/prisma';

async function debug() {
  const importer = new SportsDataIOHistoricalImporter(prismaClient);

  const raw = await importer.fetch({ tournamentId: 692 });
  console.log('Sample Raw Record:');
  console.log(JSON.stringify(raw[0], null, 2));
  console.log('\n');
  
  const normalized = importer.normalize([raw[0]]);
  console.log('Sample Normalized Record:');
  console.log(JSON.stringify(normalized[0], null, 2));
  console.log('\n');
  
  // Check what fields the persist method is looking for
  const fields = normalized[0].fields as Record<string, unknown>;
  console.log('Fields in normalized record:');
  console.log('  recordType:', fields.recordType);
  console.log('  tournamentId:', fields.tournamentId);
  console.log('  name:', fields.name);
  console.log('  playerId:', fields.playerId);
  
  await prismaClient.$disconnect();
}

debug();
