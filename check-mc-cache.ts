import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  const userId = 'dummy-user';
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setHours(0,0,0,0);

  const cached = await prisma.dailyTracking.findUnique({
    where: { userId_date: { userId, date: start } }
  });

  if (!cached) {
    console.log('No cache row for today');
  } else {
    console.log('MC cached:', cached.moodComposite);
    console.log('Date:', cached.date.toISOString());
    console.log('UpdatedAt:', cached.updatedAt.toISOString());
  }
  await prisma.$disconnect();
})();
