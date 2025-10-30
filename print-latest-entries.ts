import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  const userId = 'dummy-user';
  const entries = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`Latest 5 entries (local time):`);
  entries.forEach((e, i) => {
    const local = new Date(e.createdAt);
    console.log(`${i + 1}. ${local.toString()}  (val=${e.valence}, en=${e.energy}, fo=${e.focus}, st=${e.stress})`);
  });

  await prisma.$disconnect();
})();
