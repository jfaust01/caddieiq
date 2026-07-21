import prismaClient from '@/lib/prisma';

async function main() {
  const deleted = await prismaClient.dfsSalary.deleteMany({
    where: { operator: 'DraftKings' }
  });
  console.log('Deleted:', deleted.count, 'DraftKings salary records');
  await prismaClient.$disconnect();
}

main();
