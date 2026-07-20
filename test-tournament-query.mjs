import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function testQuery() {
  const id = 'cmrlmaaxa00084zpaelolu9vl';
  console.log(`\nQuerying tournament: ${id}\n`);

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!tournament) {
      console.log('✗ Tournament not found');
      process.exit(1);
    }

    console.log('✓ Tournament found:', tournament);
  } catch (error) {
    console.error('✗ Query failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
