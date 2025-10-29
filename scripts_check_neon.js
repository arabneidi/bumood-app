const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const userCount = await db.user.count();
  const moodCount = await db.moodEntry.count();
  const trackingCount = await db.dailyTracking.count();
  const users = await db.user.findMany({ take: 3, orderBy: { id: "asc" } });
  const latest = await db.moodEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, createdAt: true, valence: true, energy: true, focus: true, stress: true, userId: true }
  });
  console.log(JSON.stringify({ userCount, moodCount, trackingCount, users, latest }, null, 2));
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
