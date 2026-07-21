import prismaClient from '@/lib/prisma';

async function check() {
  const tournaments = await prismaClient.tournament.findMany({ take: 5 });
  console.log('Sample tournaments in database:');
  tournaments.forEach(t => {
    console.log(`- tourId: "${t.tourId}", name: "${t.name}"`);
  });

  // Also check if tournament 692 exists
  const t692 = await prismaClient.tournament.findFirst({
    where: { tourId: '692' }
  });
  console.log('\nTournament 692 exists:', !!t692);

  // Check what tourIds start with "692"
  const matches = await prismaClient.tournament.findMany({
    where: { tourId: { contains: '692' } }
  });
  console.log('Tournaments with "692" in tourId:', matches.length);

  // Find a tournament and list some fields
  const fields = await prismaClient.tournamentField.findMany({
    take: 3,
    include: { tournament: true }
  });
  console.log('\nSample tournament fields:');
  fields.forEach(f => {
    console.log(`- Tournament: "${f.tournament?.name}", TourID: "${f.tournament?.tourId}"`);
  });

  await prismaClient.$disconnect();
}

check();
