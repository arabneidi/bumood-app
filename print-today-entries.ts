import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  const userId = 'dummy-user';
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const entries = await prisma.moodEntry.findMany({
    where: { userId, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Today entries (local ${start.toString()} - ${end.toString()}): ${entries.length}`);
  for (const e of entries) {
    const local = new Date(e.createdAt);
    console.log(`- ${local.toString()}  (val=${e.valence}, en=${e.energy}, fo=${e.focus}, st=${e.stress})`);
  }

  await prisma.$disconnect();
})();
