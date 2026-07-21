import prismaClient from '@/lib/prisma';

async function check() {
  const tours = await prismaClient.tour.findMany({ take: 5 });
  console.log('Tours in database:');
  tours.forEach(t => {
    console.log(`- ID: "${t.id}", Name: "${t.name}"`);
  });

  await prismaClient.$disconnect();
}

check();
