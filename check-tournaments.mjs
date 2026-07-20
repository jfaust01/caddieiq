import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const tournaments = await prisma.tournament.findMany({
  where: { status: 'COMPLETED' },
  select: { id: true, name: true, slug: true, startDate: true, endDate: true, fieldSize: true, status: true, course: { select: { name: true } } },
  take: 5,
  orderBy: { startDate: 'desc' }
});

console.log('Recent completed tournaments:');
tournaments.forEach(t => {
  console.log(`${t.name} (${t.startDate?.toISOString().split('T')[0]} - ${t.endDate?.toISOString().split('T')[0]}) - ${t.fieldSize} players - Course: ${t.course?.name || 'N/A'}`);
});

await prisma.$disconnect();
