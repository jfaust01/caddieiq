import prismaClient from '@/lib/prisma';

async function check() {
  const tournaments = await prismaClient.tournament.findMany({ take: 3 });
  console.log('Available tournaments:');
  tournaments.forEach((t) => console.log(`- ${t.id}: ${t.name}`));
  await prismaClient.$disconnect();
}

check();
